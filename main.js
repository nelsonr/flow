import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "highlight.js/styles/github-dark.css";
import "./style.css";

const icons = { 
    arrow_left: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" > <path d="M20.3284 11.0001V13.0001L7.50011 13.0001L10.7426 16.2426L9.32842 17.6568L3.67157 12L9.32842 6.34314L10.7426 7.75735L7.49988 11.0001L20.3284 11.0001Z" fill="currentColor" /> </svg>`,
    arrow_right: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" > <path d="M15.0378 6.34317L13.6269 7.76069L16.8972 11.0157L3.29211 11.0293L3.29413 13.0293L16.8619 13.0157L13.6467 16.2459L15.0643 17.6568L20.7079 11.9868L15.0378 6.34317Z" fill="currentColor" /> </svg>`, 
};

function debounce (fn) {
    const timeout = 1000;
    let timer;

    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(fn.bind(null, ...args), timeout);
    };
}

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

    const inputHTML = `
    <div class="node__preview">
        <div>Input${icons.arrow_left}</div>
        <code>${input}</code>
    </div>`;

    const previewHTML = `
    <div class="node__preview">
        <div>Output${icons.arrow_right}</div>
        <code>${nodeValue}</code>
    </div>`;

    return `
    <div class="node" id="${elemId}" data-id="${node.id}">
        <div class="node__content">
            <div class="node__title">Node ${level}</div>
            
            <div class="node__body">
                <pre contenteditable class="node__editor">${node.code}</pre>
            
                <hr /> 

                ${input ? inputHTML : ""}
                ${previewHTML}    
            </div>
        </div>
        
        ${node.children.length > 0 ? renderTree(node.children, level, sublevel, nodeValue) : ""}
    </div>`;
}

function renderTree (tree, level = 0, sublevel = 0, input = null) {
    const treeHTML = tree
        .map((node, index) => 
            renderNode(node, level + 1, sublevel + index, input)
        )
        .flat()
        .join("");

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
    
function onNodeChange (tree, nodeId, newCode, input) {
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
            const editorEl = document.querySelector(`[data-id="${node.id}"] .node__editor`);

            editorEl.addEventListener("blur", (ev) => {
                onNodeChange(rootTree, node.id, ev.target.textContent, input);
            });

            if (node.children.length > 0) {
                setupEvents(node.children, evaluateNode(node.code, input));
            }
        });
    };
    
    setupEvents(tree);

    // Add syntax highlighting to the editor
    document.querySelectorAll(".node__editor").forEach(hljs.highlightElement);
}

const initialTree = [ 
    {
        id: crypto.randomUUID(),
        code: `"Hello World"`,
        children: [
            {
                id: crypto.randomUUID(),
                code: `$input.toUpperCase()`,
                children: [ {
                    id: crypto.randomUUID(),
                    code: `$input.split("").reverse().join("")`,
                    children: []
                } ]
            }
        ]
    },
    {
        id: crypto.randomUUID(),
        code: "[2, 4, 6]",
        children: [
            {
                id: crypto.randomUUID(),
                code: "$input.map(n => n * 2)",
                children: [ 
                    {
                        id: crypto.randomUUID(),
                        code: `$input.reduce((sum, n) => sum + n)`,
                        children: []
                    } 
                ]
            },
        ]
    },
];

hljs.registerLanguage("javascript", javascript);
render(initialTree);
