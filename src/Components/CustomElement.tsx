import { BlockNode } from "./Editor";
import React from "react";
import PropTypes from "prop-types";

type PossibleElements = "paragraph" | "bold" | "h1" | "h2" | "h3";
const elements = {
  paragraph: "p",
  bold: "b",
  h1: "h1",
  h2: "h2",
  h3: "h3",
};

interface CustomElementProps {
  type: PossibleElements;
  nodeObject: BlockNode;
  handleKeyDownFn: (Event: React.KeyboardEvent, nodeObject: BlockNode) => void;
  handleKeyUpFn: (Event: React.KeyboardEvent, nodeObject: BlockNode) => void;
  mouseDownHandler: () => void;
  mouseUpHandler: () => void;
  selectionModeOn: boolean;
  descendant: boolean;
  children: string;
}

function flattenParentAndChildNodes(
  props: CustomElementProps
): (string | JSX.Element)[] {
  //creates an array containing the value of the parent, along with the children, separated at the given offsets
  const renderArray: (string | JSX.Element)[] = [];
  let parentValue = props.nodeObject.value;
  let overallOffset = 0;
  if (props.nodeObject.descendants !== undefined) {
    for (const descendant of props.nodeObject.descendants) {
      const descendantComponent: JSX.Element = (
        <CustomElement
          key={descendant.id}
          type={descendant.type}
          handleKeyDownFn={props.handleKeyDownFn}
          handleKeyUpFn={props.handleKeyUpFn}
          mouseDownHandler={props.mouseDownHandler}
          mouseUpHandler={props.mouseUpHandler}
          nodeObject={descendant}
          selectionModeOn={props.selectionModeOn}
          descendant={true}
        >
          {descendant.value}
        </CustomElement>
      );
      if (descendant.offsetToParent && descendant.offsetToParent > 0) {
        const valueSnippet = props.nodeObject.value.substring(
          0,
          descendant.offsetToParent - overallOffset
        );
        renderArray.push(valueSnippet);
        parentValue = parentValue.substring(descendant.offsetToParent);
        overallOffset += descendant.offsetToParent;
        renderArray.push(descendantComponent);
      } else {
        renderArray.unshift(descendantComponent);
      }
    }
  }
  const valueRemainder = props.nodeObject.value.substring(overallOffset);
  renderArray.push(valueRemainder);
  return renderArray;
}

const CustomElement = React.forwardRef((props: CustomElementProps, ref) => {
  const nodeHasDescendants =
    props.nodeObject &&
    props.nodeObject.descendants &&
    props.nodeObject.descendants.length > 0;
  if (nodeHasDescendants) {
    const renderArray: (string | JSX.Element)[] =
      flattenParentAndChildNodes(props);
    return React.createElement(
      elements[props.type],
      {
        id: props.nodeObject.id,
        key: props.nodeObject.id,
        ref: props.descendant === true || !ref ? undefined : ref,
        onKeyUp: (e: React.KeyboardEvent) =>
          props.handleKeyUpFn(e, props.nodeObject),
        onKeyDown: (e: React.KeyboardEvent) =>
          props.handleKeyDownFn(e, props.nodeObject),
        onMouseDown: () => props.mouseDownHandler(),
        onMouseUp: () => props.mouseUpHandler(),
        contentEditable: !props.selectionModeOn,
        suppressContentEditableWarning: true,
        className: props.descendant === true ? undefined : "editor",
        tabIndex: 1,
      },
      renderArray
    );
  } else {
    return React.createElement(
      elements[props.type],
      {
        id: props.nodeObject.id,
        key: props.nodeObject.id,
        ref: props.descendant === true || !ref ? undefined : ref,
        onKeyUp: (e: React.KeyboardEvent) =>
          props.handleKeyUpFn(e, props.nodeObject),
        onKeyDown: (e: React.KeyboardEvent) =>
          props.handleKeyDownFn(e, props.nodeObject),
        onMouseDown: () => props.mouseDownHandler(),
        onMouseUp: () => props.mouseUpHandler(),
        contentEditable: !props.selectionModeOn,
        suppressContentEditableWarning: true,
        className: props.descendant === true ? undefined : "editor",
        tabIndex: 1,
      },
      props.children
    );
  }
});

CustomElement.propTypes = {
  type: PropTypes.oneOf(["paragraph", "bold", "h1", "h2", "h3"] as const)
    .isRequired,
  nodeObject: PropTypes.any,
  handleKeyDownFn: PropTypes.func.isRequired,
  handleKeyUpFn: PropTypes.func.isRequired,
  mouseDownHandler: PropTypes.func.isRequired,
  mouseUpHandler: PropTypes.func.isRequired,
  selectionModeOn: PropTypes.bool.isRequired,
  children: PropTypes.string.isRequired,
  descendant: PropTypes.bool.isRequired,
};

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
