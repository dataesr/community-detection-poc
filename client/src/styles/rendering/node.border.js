/* eslint-disable */
import { floatColor } from 'sigma/utils';
import { AbstractNodeProgram } from 'sigma/rendering/webgl/programs/common/node';

import vertexShaderSource from './node.border.vert.glsl?raw';
import fragmentShaderSource from './node.border.frag.glsl?raw';

const POINTS = 1;
const ATTRIBUTES = 5;

function shadeHexColor(color, percent) {
  var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
  return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

// This class only exists for the return typing of `getNodeBorderProgram`:
class AbstractNodeBorderProgram extends AbstractNodeProgram {
  constructor(gl, renderer) {
    super(gl, vertexShaderSource, fragmentShaderSource, POINTS, ATTRIBUTES);
  }
  bind() { }
  process(data, hidden, offset) { }
  render(params) { }
}

export default class NodeBorderProgram extends AbstractNodeProgram {
  borderColorLocation;

  constructor(gl) {
    super(gl, vertexShaderSource, fragmentShaderSource, POINTS, ATTRIBUTES);

    // Attribute Location
    this.borderColorLocation = gl.getAttribLocation(this.program, "a_borderColor");
  }

  bind() {
    super.bind();

    const gl = this.gl;

    gl.enableVertexAttribArray(this.borderColorLocation);
    gl.vertexAttribPointer(
      this.borderColorLocation,
      4,
      gl.UNSIGNED_BYTE,
      true,
      this.attributes * Float32Array.BYTES_PER_ELEMENT,
      16,
    );
  }

  process(data, hidden, offset) {
    const { array } = this;
    let i = offset * POINTS * ATTRIBUTES;
    if (hidden) {
      array[i++] = 0;
      array[i++] = 0;
      array[i++] = 0;
      array[i++] = 0;
      array[i++] = 0;
      return;
    }
    const color = floatColor(data.color);
    const borderColor = floatColor(shadeHexColor(data.color, -0.4));

    array[i++] = data.x;
    array[i++] = data.y;
    array[i++] = data.size;
    array[i++] = color;
    array[i] = borderColor;
  }

  render(params) {
    if (this.hasNothingToRender()) { return; }
    const { gl } = this;
    const { program } = this;
    gl.useProgram(program);
    gl.uniform1f(this.ratioLocation, 1 / Math.sqrt(params.ratio));
    gl.uniform1f(this.scaleLocation, params.scalingRatio);
    gl.uniformMatrix3fv(this.matrixLocation, false, params.matrix);
    gl.drawArrays(gl.POINTS, 0, this.array.length / ATTRIBUTES);
  }
}
