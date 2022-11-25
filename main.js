import { debounce, pipe, filter, map, loadFromLocalStorage, updateLocalStorage } from "./src/utils";
import { renderNodesConnections } from "./src/canvas";
import "./style.css";

const icons = { 
    add: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6C12.5523 6 13 6.44772 13 7V11H17C17.5523 11 18 11.4477 18 12C18 12.5523 17.5523 13 17 13H13V17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17V13H7C6.44772 13 6 12.5523 6 12C6 11.4477 6.44772 11 7 11H11V7C11 6.44772 11.4477 6 12 6Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M5 22C3.34315 22 2 20.6569 2 19V5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5ZM4 19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H5C4.44772 4 4 4.44772 4 5V19Z" fill="currentColor" /></svg>`,
    remove: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13H16C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11H8Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M1 5C1 2.79086 2.79086 1 5 1H19C21.2091 1 23 2.79086 23 5V19C23 21.2091 21.2091 23 19 23H5C2.79086 23 1 21.2091 1 19V5ZM5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z" fill="currentColor" /></svg>`,
};

function evaluateNode (code, input = null) {
    const inputStr = input !== null ? "const $input = arguments[0]; " : "";
    const returnValue = code.includes("return ") ? inputStr : inputStr + "return ";

    try {
        return new Function(returnValue + code)(input);
    } catch (error) {
        console.log(error.message);
        
        return undefined;
    }
}

function renderNode (node, level, sublevel, input = null) {
    const nodeValue = evaluateNode(node.code, input);
    const elemId = `node-${level}-${sublevel}`;

    const previewHTML = `
    <div class="node__preview node__output">
        <div>Output</div>
        <code>${nodeValue}</code>
    </div>`;

    return `
    <div class="node" id="${elemId}" data-id="${node.id}">
        <div class="node__content">
            <div class="node__header">
                <div class="node__title">Node ${level}.${sublevel}</div>
                <div class="node__actions">
                    <button class="node__add">${icons.add}</button>
                    <button class="node__remove">${icons.remove}</button>
                </div>
            </div>
            
            <div class="node__body">
                <div class="node__editor">
                    <textarea>${node.code}</textarea>
                    <pre>${node.code}</pre>
                </div>
            
                <hr /> 
                ${previewHTML}    
            </div>
        </div>
        
        ${node.children.length > 0 ? renderNodes(node.children, level, nodeValue) : ""}
    </div>`;
}

function renderNodes (nodes, level = 0, input = null) {
    const treeHTML = nodes.map((node, index) => 
        renderNode(node, level + 1, index, input)
    ).flat().join("");

    return `<div class="nodes">${treeHTML}</div>`;
}

function addNode (state, parentNodeId) {
    const newNode = {
        id: crypto.randomUUID(),
        code: `$input`,
        children: []
    };
    
    const mapNodes = map((node) => {
        if (node.id === parentNodeId) {
            return {
                ...node,
                children: [ ...node.children, newNode ] 
            };
        } else if (node.children.length > 0) {
            return {
                ...node, 
                children: mapNodes(node.children)
            };
        }

        return node;
    });

    return {
        ...state,
        nodes: mapNodes(state.nodes)
    };
}

function removeNode (state, nodeId) {
    const filterNodes = filter((node) => node.id !== nodeId);
    const mapNodes = map((node) => {
        return {
            ...node,
            children: excludeNode(node.children)
        };
    });

    const excludeNode = pipe(filterNodes, mapNodes);

    return {
        ...state,
        nodes: excludeNode(state.nodes)
    };
}

function updateNode (nodes, nodeId, nodeCode) {
    return nodes.map((node) => {
        if (node.id === nodeId) {
            node.code = nodeCode;
        } else if (node.children.length > 0) {
            node.children = updateNode(node.children, nodeId, nodeCode);
        }

        return node;
    });
}
    
function onNodeChange (state, nodeId, code, cursorPos, input = null) {
    const isValid = evaluateNode(code, input) !== undefined;

    // Update tree only when the new code evaluates to a value
    if (isValid) {
        const updatedNodes = updateNode(state.nodes, nodeId, code);
        const updatedState = {
            focus: {
                nodeId: nodeId,
                position: cursorPos
            },
            nodes: updatedNodes 
        };

        updateLocalStorage(updatedState);
        render(updatedState);
    }
}

function render (state) {
    const nodes = state.nodes;

    document.querySelector("#app").innerHTML = renderNodes(nodes);

    function setupEditor (nodes, input = null) {
        nodes.forEach(node => {
            const editorEl = document.querySelector(`[data-id="${node.id}"] .node__editor textarea`);
            const editorSizeEl = document.querySelector(`[data-id="${node.id}"] .node__editor pre`);
            const addNodeBtn = document.querySelector(`[data-id="${node.id}"] .node__add`);
            const removeNodeBtn = document.querySelector(`[data-id="${node.id}"] .node__remove`);
            
            addNodeBtn.addEventListener("click", () => {
                const updatedState = addNode(state, node.id);
                updateLocalStorage(updatedState);
                render(updatedState);
            });

            removeNodeBtn.addEventListener("click", () => {
                const updatedState = removeNode(state, node.id);
                updateLocalStorage(updatedState);
                render(updatedState);
            });
            
            editorEl.addEventListener("input", (ev) => { 
                editorSizeEl.textContent = ev.target.value;
                renderNodesConnections(state.nodes);
            });

            editorEl.addEventListener("input", debounce((ev) => {
                const cursorPos = ev.target.selectionStart;
                onNodeChange(state, node.id, ev.target.value, cursorPos, input);
            }), 2000);

            if (node.children.length > 0) {
                setupEditor(node.children, evaluateNode(node.code, input));
            }

            if (state.focus.nodeId === node.id) {
                editorEl.focus();
                editorEl.selectionStart = state.focus.position;
            }
        });
    }
    
    setupEditor(nodes);
    renderNodesConnections(nodes);
}

function main () {
    const defaultState = {
        focus: {
            nodeId: null,
            position: null
        },
        nodes: [
            {
                id: crypto.randomUUID(),
                code: `"Hello World"`,
                children: [
                    {
                        id: crypto.randomUUID(),
                        code: `$input.toUpperCase()`,
                        children: []
                    }
                ]
            }
        ]
    };

    const storedState = loadFromLocalStorage();

    if (storedState !== null && storedState.nodes.length > 0) {
        render(storedState);
    } else {
        render(defaultState);
    }
}

main();
