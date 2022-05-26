import React, { useEffect, useRef, useState } from "react"
import shortId from "shortid"

interface BlockNode {
    id: string;
    displayIndex: number;
    type: string;
    children: string;
}

export default function Editor(): JSX.Element {

    const [editorText, setEditorText] = useState<BlockNode[]>([{ id: shortId.generate(), displayIndex: 0, type: "paragraph", children: "" }])
    const [focusId, setFocusId] = useState(0)
    const [selectionModeOn, setSelectionModeOn] = useState(false)
    const [selection, setSelection] = useState<Selection | null>(null)
    const blockRef = useRef<HTMLDivElement>(null);

    document.onkeydown = (e) => {
        if (e.ctrlKey && e.key === 'b') {
            return false
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault()
        }
        else if (e.ctrlKey && e.key === 'b') {
            console.log("EASY")
            return
        }



    }

    function handleKeyUp(e: React.KeyboardEvent, currentBlock: BlockNode) {
        if (e.key === 'Enter') {
            createNewBlock(e, currentBlock)
        } else {
            // update the object tree 
        }
    }


    function createNewBlock(e: React.KeyboardEvent, currentBlock: BlockNode) {
        e.preventDefault()

        const cursorPosition = window.getSelection()?.getRangeAt(0).startOffset

        const textInCurrentBlock = (e.currentTarget as HTMLDivElement).innerText
        const currentBlockIndex = currentBlock.displayIndex

        const newState = [...editorText]
        newState[currentBlockIndex].children = textInCurrentBlock.slice(0, cursorPosition) // keep before cursor in current block
        const textToCarryOver = textInCurrentBlock.slice(cursorPosition) // keep text after cursor in new block

        const newBlockIndex = currentBlockIndex + 1
        const newBlock: BlockNode = { id: shortId.generate(), type: "paragraph", children: textToCarryOver, displayIndex: newBlockIndex }

        // increase the display indexes for all blocks after the new one
        newState.forEach(b =>
            b.displayIndex > currentBlockIndex ? b.displayIndex += 1 : b.displayIndex
        )

        newState.splice(newBlockIndex, 0, newBlock)

        setEditorText(newState)
        setFocusId(newBlockIndex)

    }

    function mouseUpHandler() {

        if (window.getSelection()?.isCollapsed == false) {// if a valid selection exists
            setSelection(window.getSelection()) // save the selection
        }
    }

    function mouseDownHandler() {
        if (selection === null && window.getSelection()?.isCollapsed == false) { // there is no existing selection, so allow selecting
            console.log("You're allowed to select")
            setSelectionModeOn(true)
        } else { //there is a selection, disallow selecting
            setSelectionModeOn(false)
            setSelection(null)
        }
    }

    useEffect(() => {
        blockRef.current?.focus()
    }, [focusId])

    useEffect(() => {
        if (selection) {
            selection.addRange(selection.getRangeAt(0))
        }
    }, [selectionModeOn])


    return (
        <>
            {editorText.map((t) =>
                <div
                    tabIndex={1}
                    ref={focusId === t.displayIndex ? blockRef : undefined}
                    className="editor" key={t.id}
                    onKeyDown={e => handleKeyDown(e)}
                    onKeyUp={(e) => handleKeyUp(e, t)}
                    onMouseDown={() => mouseDownHandler()}
                    onMouseUp={(() => mouseUpHandler())}
                    contentEditable={!selectionModeOn}
                    suppressContentEditableWarning={true}>
                    {t.children}
                </div>)}
        </>
    )
}