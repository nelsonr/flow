import "./style.css";

function debounce (fn) {
    const timeout = 1000;
    let timer;

    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(fn.bind(null, ...args), timeout);
    };
}

function evaluateNode (code, input = null) {
    const inputStr = input !== null ? "const $input = arguments[0];" : "";

    try {
        return new Function(inputStr + code)(input);
    } catch (error) {
        console.log(error.message);
        
        return undefined;
    }
}

function renderNode (node, level, sublevel, input = null) {
    const nodeValue = evaluateNode(node.code, input);
    const elemId = `node-${level}-${sublevel}`;

    const inputHTML = `
    <div class="node__preview">
        <div>Input</div>
        <code>${input}</code>
    </div>`;

    const previewHTML = `
    <div class="node__preview">
        <div>Output</div>
        <code>${nodeValue}</code>
    </div>`;

    return `
    <div class="node" id="${elemId}" data-id="${node.id}">
        <div class="node__content">
            <div class="node__title">Node ${level}.${sublevel}</div>
            
            <div class="node__body">
                <pre 
                    contenteditable 
                    class="node__editor" 
                    data-input="${input}"
                >${node.code}</pre>
            
                <hr /> 

                ${input ? inputHTML : ""}
                ${previewHTML}    
            </div>
        </div>
        
        ${node.children ? renderTree(node.children, level + 1, nodeValue) : ""}
    </div>`;
}

function renderTree (tree, level = 1, input = null) {
    const treeHTML = tree.map((node, index) => renderNode(node, level, index, input)).flat().join("");

    return `<div class="nodes">${treeHTML}</div>`;
}

function updateNode (tree, nodeId, nodeCode) {
    return tree.map((node) => {
        if (node.id === nodeId) {
            node.code = nodeCode;
        } else if (node.children.length > 0) {
            node.children = updateNode(node.children, nodeId, nodeCode);
        }

        return node;
    });
}
    
function onChange (tree, nodeId, newCode, input) {
    const isValid = evaluateNode(newCode, input) !== undefined;

    // Update tree only when the new code evaluates to a value
    if (isValid) {
        render(updateNode(tree, nodeId, newCode));
    }
}

function render (tree) {
    const rootTree = tree;

    document.querySelector("#app").innerHTML = renderTree(tree);

    const setupEvents = (tree, input = null) => {
        tree.forEach((node) => {
            const editor = document.querySelector(`[data-id="${node.id}"] pre`);

            editor.addEventListener("input", debounce((ev) => {
                onChange(rootTree, node.id, ev.target.textContent, input);
            }));

            if (node.children.length > 0) {
                setupEvents(node.children, evaluateNode(node.code, input));
            }
        });
    };
    
    setupEvents(tree);
}

const initialTree = [ {
    id: crypto.randomUUID(),
    code: "return [2, 4, 6];",
    children: [
        {
            id: crypto.randomUUID(),
            code: "return $input.map(n => n * n);",
            children: []
        },
    ]
} ];

render(initialTree);
