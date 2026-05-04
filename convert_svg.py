import re

svg_path = "M140.773,79.99l-3.76-3.757v1.969h-19.101c-.761-2.484-3.073-4.293-5.806-4.293s-5.046,1.809-5.806,4.293h-14.95l.219-.622,1.081-3.062,2.579-7.29,15.225-15.222.847.847.003-4.211h-4.213l.85.85-14.74,14.737-7.9,3.088-3.002,1.176-.557.216v-14.953c2.49-.761,4.302-3.079,4.302-5.818s-1.812-5.057-4.302-5.818v-20.908h2.016l-3.755-3.757-3.76,3.757h1.945v20.908c-2.49.761-4.305,3.079-4.305,5.818s1.815,5.057,4.305,5.818v16.342l-4.045,1.584-22.157-22.154.85-.85h-4.211v4.211l.85-.85,22.193,22.193-1.472,3.971h-16.549c-.758-2.484-3.071-4.293-5.806-4.293s-5.046,1.809-5.806,4.293h-19.048v-1.969l-3.757,3.755,3.757,3.757v-1.99h19.048c.761,2.487,3.074,4.293,5.806,4.293s5.048-1.806,5.806-4.293h15.234l-.195.524-1.119,3.023-2.68,7.243-15.412,15.412-.85-.85v4.211h4.211l-.85-.85,14.642-14.639,8.457-3.162,3.041-1.137.062-.024v14.728c-2.484.761-4.293,3.073-4.293,5.806s1.809,5.046,4.293,5.806v20.943h-1.945l3.757,3.757,3.757-3.757h-2.016v-20.943c2.484-.761,4.293-3.074,4.293-5.806s-1.809-5.046-4.293-5.806v-16.057l4.273-1.596,21.926,21.926-.85.847,4.211.003v-4.213l-.847.85-21.899-21.899,1.534-4.338h16.211c.761,2.487,3.074,4.293,5.806,4.293s5.046-1.806,5.806-4.293h19.101v1.99l3.76-3.755ZM80.212,84.443c-2.401.027-4.367-1.901-4.391-4.302-.024-2.401,1.901-4.367,4.302-4.394,2.401-.024,4.367,1.904,4.394,4.305.024,2.401-1.904,4.367-4.305,4.391Z"

import xml.etree.ElementTree as ET
import os

try:
    from svgpathtools import parse_path, Line, CubicBezier
except ImportError:
    os.system('pip3 install svgpathtools')
    from svgpathtools import parse_path, Line, CubicBezier

path = parse_path(svg_path)
swift_code = []
for segment in path:
    if isinstance(segment, Line):
        swift_code.append(f"p.addLine(to: CGPoint(x: {segment.end.real:.2f}, y: {segment.end.imag:.2f}))")
    elif isinstance(segment, CubicBezier):
        swift_code.append(f"p.addCurve(to: CGPoint(x: {segment.end.real:.2f}, y: {segment.end.imag:.2f}), control1: CGPoint(x: {segment.control1.real:.2f}, y: {segment.control1.imag:.2f}), control2: CGPoint(x: {segment.control2.real:.2f}, y: {segment.control2.imag:.2f}))")

# The path needs moves where components break.
swift_code = []
for p in path.continuous_subpaths():
    start = p[0].start
    swift_code.append(f"p.move(to: CGPoint(x: {start.real:.2f}, y: {start.real:.2f}))")
    for segment in p:
        if isinstance(segment, Line):
            swift_code.append(f"p.addLine(to: CGPoint(x: {segment.end.real:.2f}, y: {segment.end.imag:.2f}))")
        elif isinstance(segment, CubicBezier):
            swift_code.append(f"p.addCurve(to: CGPoint(x: {segment.end.real:.2f}, y: {segment.end.imag:.2f}), control1: CGPoint(x: {segment.control1.real:.2f}, y: {segment.control1.imag:.2f}), control2: CGPoint(x: {segment.control2.real:.2f}, y: {segment.control2.imag:.2f}))")
    swift_code.append("p.closeSubpath()")

print("path length: ", len(swift_code))
