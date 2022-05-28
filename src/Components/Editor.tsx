import React, { useEffect, useRef, useState } from "react";
import shortId from "shortid";
import CustomElement from "./CustomElement";

export interface BlockNode {
    id: string;
    displayIndex: number;
    type: ElementTag;
    value: string;
    offsetToParent?: number;
    descendants?: BlockNode[];
}

export type ElementTag = "paragraph" | "bold";

export default function Editor(props: BlockNode): JSX.Element {
    const [editorText, setEditorText] = useState<BlockNode[]>([
        {
            id: shortId.generate(),
            displayIndex: 0,
            type: "paragraph",
            value: "",
        },
    ]);
    const [focusId, setFocusId] = useState(0);
    const previousFocusId = useRef<number>(0);
    const [selectionModeOn, setSelectionModeOn] = useState(false);
    const [selection, setSelection] = useState<Selection | null>(null);
    const [newBlockCreated, setNewBlockCreated] = useState<boolean>(false);
    const blockRef = useRef<HTMLElement>(null);

    document.onkeydown = (e) => {
        if (e.ctrlKey && e.key === "b") {
            return false;
        }
    };

    document.onselectionchange = () => {
        setSelection(window.getSelection());
    };

    function setCursorPosition(block: BlockNode, offset?: number): void {
        // defaults to start, but offset of -1 goes to end of block
        const toStart = offset === -1 ? false : true
        const blockElement = document.getElementById(block.id)
        if (blockElement) {
            window.getSelection()?.removeAllRanges()
            const newRange = document.createRange();
            newRange.selectNodeContents(blockElement.childNodes[0]);
            offset ? newRange.setStart(blockElement.childNodes[0], offset) : newRange.setStart(blockElement.childNodes[0], 0)
            newRange.collapse(toStart);
            window.getSelection()?.addRange(newRange)
            console.log(window.getSelection()?.getRangeAt(0))
        }
    }

    function handleKeyDown(e: React.KeyboardEvent, currentBlock: BlockNode) {
        if (e.key === "Enter") {
            e.preventDefault();
        } else if (e.key === "Backspace") {
            deleteBlock(e, currentBlock);
        } else if (e.ctrlKey && e.key === "b") {
            if (selection && selection.isCollapsed === false) {
                const selectionOffset = selection.getRangeAt(0).startOffset;
                const selectionValue = selection?.toString();
                const selectionLength = selectionValue?.length;
                const blockElement: HTMLElement = selection?.anchorNode
                    ?.parentNode as HTMLElement;
                const blockId = blockElement.getAttribute("id");
                const newBlocks = [...editorText];
                const blockIndex = newBlocks.findIndex((b) => b.id === blockId);
                const currentValue = newBlocks[blockIndex].value;
                const newValue = `${currentValue.substring(
                    0,
                    selectionOffset
                )}${currentValue.substring(selectionOffset + selectionLength)}`;
                const updatedBlock = { ...newBlocks[blockIndex] };
                updatedBlock.value = newValue;
                const boldBlock: BlockNode = {
                    id: shortId.generate(),
                    displayIndex: 0,
                    type: "bold",
                    value: selectionValue,
                    offsetToParent: selectionOffset,
                };
                updatedBlock.descendants = [boldBlock];

                newBlocks.splice(blockIndex, 1, updatedBlock);
                setEditorText(newBlocks);
            }
        }
    }

    function handleKeyUp(e: React.KeyboardEvent, currentBlock: BlockNode) {
        if (e.key === "Enter") {
            createNewBlock(e, currentBlock);
        } else {
            const textInCurrentBlock = (e.currentTarget as HTMLElement).innerText;
            const newState = [...editorText];
            newState[currentBlock.displayIndex].value = textInCurrentBlock;
            setEditorText(editorText)
        }
    }

    function deleteBlock(e: React.KeyboardEvent, currentBlock: BlockNode) {
        const cursorAtBeginningOfBlock =
            window.getSelection()?.getRangeAt(0).startOffset === 0;
        if (cursorAtBeginningOfBlock && currentBlock.displayIndex > 0) {
            const currentBlockIndex = currentBlock.displayIndex;

            const newState = [...editorText];

            // decrease the display indexes for all blocks after the block to be deleted
            newState.forEach((b) =>
                b.displayIndex > currentBlockIndex
                    ? (b.displayIndex -= 1)
                    : b.displayIndex
            );

            newState.splice(currentBlockIndex, 1);
            previousFocusId.current = focusId;
            setFocusId(currentBlockIndex - 1);
            setEditorText(newState);
        }
    }

    function createNewBlock(e: React.KeyboardEvent, currentBlock: BlockNode) {
        e.preventDefault();

        const cursorPosition = window.getSelection()?.getRangeAt(0).startOffset;
        const textInCurrentBlock = (e.currentTarget as HTMLElement).innerText;
        const currentBlockIndex = currentBlock.displayIndex;

        const newState = [...editorText];
        newState[currentBlockIndex].value = textInCurrentBlock.slice(
            0,
            cursorPosition
        ); // keep before cursor in current block
        const textToCarryOver = textInCurrentBlock.slice(cursorPosition); // keep text after cursor in new block

        const newBlockIndex = currentBlockIndex + 1;
        const newBlock: BlockNode = {
            id: shortId.generate(),
            type: "paragraph",
            value: textToCarryOver,
            displayIndex: newBlockIndex,
        };

        // increase the display indexes for all blocks after the block to be created
        newState.forEach((b) =>
            b.displayIndex > currentBlockIndex
                ? (b.displayIndex += 1)
                : b.displayIndex
        );

        newState.splice(newBlockIndex, 0, newBlock);
        setNewBlockCreated(true);
        previousFocusId.current = focusId;
        setFocusId(newBlockIndex);
        setEditorText(newState);
    }

    function mouseUpHandler() {
        if (window.getSelection()?.isCollapsed === false) {
            // if a valid selection exists
            setSelection(window.getSelection()); // save the selection
        } else {
            setSelectionModeOn(false);
        }
    }

    function mouseDownHandler() {
        if (selection === null || window.getSelection()?.isCollapsed === true) {
            // there is no existing selection, so allow selecting
            setSelectionModeOn(true);
        } else {
            //there is a selection, disallow selecting
            setSelectionModeOn(false);
            setSelection(null);
        }
    }

    function moveCursorToEnd(element: HTMLElement) {
        const newRange = document.createRange();
        window.getSelection()?.removeAllRanges();
        newRange.selectNodeContents(element);
        newRange.collapse(false);
        window.getSelection()?.addRange(newRange);
    }

    // focus on end of text or beginning
    useEffect(() => {
        if (blockRef.current !== null) {
            const endPosition = blockRef.current.innerText.length - 1;
            if (endPosition > 0 && !(focusId - previousFocusId.current === 1)) {
                moveCursorToEnd(blockRef.current);
            }
            blockRef.current?.focus();
        }
    }, [focusId, editorText, newBlockCreated]);

    //preserve selection when element is contenteditable again
    useEffect(() => {
        if (selection) {
            selection.addRange(selection.getRangeAt(0));
        }
    }, [selectionModeOn, selection]);

    return (
        <>
            {editorText.map((t) => (
                <CustomElement
                    ref={focusId === t.displayIndex ? blockRef : undefined}
                    key={t.id}
                    type={t.type}
                    handleKeyDownFn={handleKeyDown}
                    handleKeyUpFn={handleKeyUp}
                    mouseDownHandler={mouseDownHandler}
                    mouseUpHandler={mouseUpHandler}
                    nodeObject={t}
                    selectionModeOn={selectionModeOn}
                    descendant={false}
                >
                    {t.value}
                </CustomElement>
                // <span
                //     tabIndex={1}
                //     ref={focusId === t.displayIndex ? blockRef : undefined}
                //     className="editor"
                //     key={t.id}
                //     onKeyDown={(e) => handleKeyDown(e, t)}
                //     onKeyUp={(e) => handleKeyUp(e, t)}
                //     onMouseDown={() => mouseDownHandler()}
                //     onMouseUp={() => mouseUpHandler()}
                //     contentEditable={!selectionModeOn}
                //     suppressContentEditableWarning={true}
                // >
                //     {`${lookUp[t.type].open}${t.value}${lookUp[t.type].close}`}
                // </span>
            ))}
        </>
    );
}
