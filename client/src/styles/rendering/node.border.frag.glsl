precision mediump float;

varying vec4 v_color;
varying float v_border;
varying vec4 v_borderColor;

const float radius = 0.5;
const float halfRadius = 0.45;

const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);
const vec4 colortest = vec4(0.2, 0.2, 0.2, 0.8);

void main(void) {

    vec4 v_border_color = v_borderColor;

    float distToCenter = length(gl_PointCoord - vec2(0.5, 0.5));

    if (distToCenter < halfRadius - v_border)
        gl_FragColor = v_color;
    else if (distToCenter < halfRadius)
        gl_FragColor = mix(v_border_color, v_color, (halfRadius - distToCenter) / v_border);
    else if (distToCenter < radius - v_border)
        gl_FragColor = v_border_color;
    else if (distToCenter < radius)
        gl_FragColor = mix(transparent, v_border_color, (radius - distToCenter) / v_border);
    else
        gl_FragColor = transparent;
}
