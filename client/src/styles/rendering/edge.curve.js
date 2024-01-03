/* eslint-disable */
import { floatColor, canUse32BitsIndices } from 'sigma/utils';
import { AbstractEdgeProgram } from 'sigma/rendering/webgl/programs/common/edge';

import vertexShaderSource from './edge.curve.vert.glsl?raw';
import fragmentShaderSource from './edge.curve.frag.glsl?raw';

const POINTS = 2,
  ATTRIBUTES = 3;

export default class EdgeFastProgram extends AbstractEdgeProgram {
  positionLocation;
  colorLocation;
  matrixLocation;

  constructor(gl) {
    super(gl, vertexShaderSource, fragmentShaderSource, POINTS, ATTRIBUTES);

    // Locations:
    this.positionLocation = gl.getAttribLocation(this.program, "a_position");
    this.colorLocation = gl.getAttribLocation(this.program, "a_color");

    // Uniform locations:
    const matrixLocation = gl.getUniformLocation(this.program, "u_matrix");
    if (matrixLocation === null) throw new Error("EdgeFastProgram: error while getting matrixLocation");
    this.matrixLocation = matrixLocation;

    this.bind();
  }

  bind() {
    const gl = this.gl;

    // Bindings
    gl.enableVertexAttribArray(this.positionLocation);
    gl.enableVertexAttribArray(this.colorLocation);

    gl.vertexAttribPointer(
      this.positionLocation,
      2,
      gl.FLOAT,
      false,
      this.attributes * Float32Array.BYTES_PER_ELEMENT,
      0,
    );
    gl.vertexAttribPointer(
      this.colorLocation,
      4,
      gl.UNSIGNED_BYTE,
      true,
      this.attributes * Float32Array.BYTES_PER_ELEMENT,
      8,
    );
  }

  computeIndices() {
    //nothing to do
  }

  process(sourceData, targetData, data, hidden, offset) {
    const array = this.array;

    let i = 0;
    if (hidden) {
      for (let l = i + POINTS * ATTRIBUTES; i < l; i++) array[i] = 0;
      return;
    }

    const x1 = sourceData.x,
      y1 = sourceData.y,
      x2 = targetData.x,
      y2 = targetData.y,
      color = floatColor(data.color);

    i = POINTS * ATTRIBUTES * offset;

    // First point
    array[i++] = x1;
    array[i++] = y1;
    array[i++] = color;

    // Second point
    array[i++] = x2;
    array[i++] = y2;
    array[i] = color;
  }

  render(params) {
    if (this.hasNothingToRender()) return;

    const gl = this.gl;
    const program = this.program;

    gl.useProgram(program);

    gl.uniformMatrix3fv(this.matrixLocation, false, params.matrix);

    gl.drawArrays(gl.LINES, 0, this.array.length / ATTRIBUTES);
  }
}


