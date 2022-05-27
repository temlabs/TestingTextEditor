import { BlockNode } from "./Editor";
import React from "react";

type possibleElements = "paragraph" | "bold" | "h1" | "h2" | "h3";
const elements = {
  paragraph: "p",
  bold: "b",
  h1: "h1",
  h2: "h2",
  h3: "h3",
};

interface CustomElementProps {
  type: possibleElements;
  ref: React.RefObject<HTMLElement> | undefined;
  nodeObject: BlockNode;
  handleKeyDownFn: (Event: React.KeyboardEvent, nodeObject: BlockNode) => void;
  handleKeyUpFn: (Event: React.KeyboardEvent, nodeObject: BlockNode) => void;
  mouseDownHandler: () => void;
  mouseUpHandler: () => void;
  selectionModeOn: boolean;
  children: string;
}

const CustomElement = React.forwardRef((props: CustomElementProps, ref) =>
  React.createElement(
    elements[props.type],
    {
      id: props.nodeObject.id,
      key: props.nodeObject.id,
      ref: ref,
      onKeyUp: (e: React.KeyboardEvent) =>
        props.handleKeyUpFn(e, props.nodeObject),
      onKeyDown: (e: React.KeyboardEvent) =>
        props.handleKeyDownFn(e, props.nodeObject),
      onMouseDown: () => props.mouseDownHandler(),
      onMouseUp: () => props.mouseUpHandler(),
      contentEditable: !props.selectionModeOn,
      suppressContentEditableWarning: true,
      className: "editor",
      tabIndex: 1,
    },
    props.children
  )
);
CustomElement.displayName = "CustomElement";
export default CustomElement;
// export default function CustomElement(props: CustomElementProps): JSX.Element {
//     return React.createElement(elements[props.type], {
//         key: props.nodeObject.id,
//         ref: props.ref,
//         onKeyUp: props.handleKeyUpFn,
//         onKeyDown: props.handleKeyDownFn,
//         onMouseDown: props.mouseDownHandler,
//         onMouseUp: props.mouseUpHandler,
//         contentEditable: !props.selectionModeOn,
//         suppressContentEditableWarning: true,
//         className: 'editor'
//     })

// }
