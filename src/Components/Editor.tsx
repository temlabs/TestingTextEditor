import React, { useEffect, useRef, useState } from "react"


interface BlockNode {
    id: number;
    type: string;
    startPos: number;
    index: number;
    children: BlockNode[]
}

export default function Editor(): JSX.Element {

    const [editorText, setEditorText] = useState([{ id: 0, type: "paragraph", children: "" }])
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

    function handleKeyUp(e: React.KeyboardEvent, objectId: number) {
        if (e.key === 'Enter') {
            createNewBlock(e, objectId)
        }
    }


    function createNewBlock(e: React.KeyboardEvent, objectId: number) {
        e.preventDefault()
        const newState = [...editorText]
        newState[objectId].children = (e.currentTarget as HTMLDivElement).innerText
        newState.push({ id: objectId + 1, type: "paragraph", children: "" })

        setEditorText(newState)
        setFocusId(objectId + 1)

    }

    function mouseUpHandler() {

        if (window.getSelection()?.isCollapsed == false) {
            setSelection(window.getSelection())
        }
    }

    function mouseDownHandler() {
        if (selection === null) { // there is no selection, so allow selecting
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
                    ref={focusId === t.id ? blockRef : undefined}
                    className="editor" key={t.id}
                    onKeyDown={e => handleKeyDown(e)}
                    onKeyUp={(e) => handleKeyUp(e, t.id)}
                    onMouseDown={() => mouseDownHandler()}
                    onMouseUp={(() => mouseUpHandler())}
                    contentEditable={!selectionModeOn}
                    suppressContentEditableWarning={true}>
                    {t.children}
                </div>)}
        </>
    )
}