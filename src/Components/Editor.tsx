import React, { useEffect, useRef, useState } from "react";
import shortId from "shortid";
import CustomElement from "./CustomElement";

export interface BlockNode {
    ref: React.RefObject<HTMLElement>;
    id: string;
    displayIndex: number;
    type: ElementTag;
    value: string;
    offsetToParent?: number;
    descendants?: BlockNode[];
    idBreadcrumb: string[];
}

export type ElementTag = "paragraph" | "bold";

export default function Editor(): JSX.Element {
    const initialId = shortId.generate();
    const [editorText, setEditorText] = useState<BlockNode[]>([
        {
            ref: React.createRef(),
            id: initialId,
            displayIndex: 0,
            type: "paragraph",
            value: "",
            idBreadcrumb: [initialId],
        },
    ]);
    const [focusId, setFocusId] = useState(0);
    const previousFocusId = useRef<number>(0);
    const [selectionModeOn, setSelectionModeOn] = useState(false);
    const [selection, setSelection] = useState<Selection | null>(null);
    const [cursorPosition, setCursorPosition] = useState({
        block: editorText[0],
        offset: 0,
    });

    document.onkeydown = (e) => {
        if (e.ctrlKey && e.key === "b") {
            return false;
        }
    };

    document.onselectionchange = () => {
        setSelection(window.getSelection());
    };

    function moveCursor(block: BlockNode, offset = 0): void {
        // if no offset specified, it defaults to start. offset of -1 and it goes to end of block
        const toStart = offset === -1 ? false : true;
        const blockElement = block.ref.current;
        if (blockElement) {
            window.getSelection()?.removeAllRanges();
            const newRange = document.createRange();
            const emptyBlock = blockElement.childNodes.length === 0;
            const nodeTree = emptyBlock ? blockElement : blockElement.childNodes[0];
            newRange.selectNodeContents(nodeTree);
            if (offset !== -1) {
                if (emptyBlock) {
                    newRange.setStart(nodeTree, 0);
                } else {
                    console.log("it knows it's not empty");
                    console.log({ nodeTree, offset });
                    newRange.setStart(nodeTree, offset);
                }
            }
            newRange.collapse(toStart);
            window.getSelection()?.addRange(newRange);
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
                const id = shortId.generate();
                const boldBlock: BlockNode = {
                    ref: React.createRef(),
                    id: id,
                    displayIndex: 0,
                    type: "bold",
                    value: selectionValue,
                    offsetToParent: selectionOffset,
                    idBreadcrumb: [...currentBlock.idBreadcrumb, id],
                };
                updatedBlock.descendants = [boldBlock];

                newBlocks.splice(blockIndex, 1, updatedBlock);
                setEditorText(newBlocks);
                setCursorPosition({ block: boldBlock, offset: selectionLength });
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
            // line above is wrong, because current block might be nested so won't necessarily be an index of the main array.
            // a searching algo will be needed- could use a stack or binary tree search or something to match the id
            // let it be that the function takes an id, and a value to set that block id to, then once found, you can set it in the function.
            setEditorText(editorText);
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
            const previousBlock = editorText[currentBlockIndex - 1];
            setCursorPosition({ block: previousBlock, offset: -1 });
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
        const id = shortId.generate();
        const newBlock: BlockNode = {
            ref: React.createRef(),
            id: id,
            type: "paragraph",
            value: textToCarryOver,
            displayIndex: newBlockIndex,
            idBreadcrumb: [id],
        };

        // increase the display indexes for all blocks after the block to be created
        newState.forEach((b) =>
            b.displayIndex > currentBlockIndex
                ? (b.displayIndex += 1)
                : b.displayIndex
        );

        newState.splice(newBlockIndex, 0, newBlock);
        previousFocusId.current = focusId;
        setFocusId(newBlockIndex);
        setEditorText(newState);
        setCursorPosition({ block: newBlock, offset: 0 });
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

    useEffect(() => {
        moveCursor(cursorPosition.block, cursorPosition.offset);
    }, [cursorPosition]);



    return (
        <>
            {editorText.map((t) => (
                <CustomElement
                    ref={t.ref}
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
            ))}
        </>
    );
}
