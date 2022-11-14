import "./style.css";

function debounce (fn) {
    const timeout = 1000;
    let timer;

    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(fn.bind(null, ...args), timeout);
    };
}

function evaluateNode (node, input = null) {
    const inputStr = input !== null ? "const $input = arguments[0];" : "";

    return new Function(inputStr + node.code)(input);
}

function renderNode (node, input = null) {
    const nodeValue = evaluateNode(node, input);
    const elemId = "node-" + node.id.replace(".", "-");

    const inputHTML = `
    <div class="node__preview">
        <div>Input</div>
        <code>${input}</code>
    </div>`;

    const previewHTML = `
    <div class="node__preview">
        <div>Result</div>
        <code>${nodeValue}</code>
    </div>`;
    
    return `
    <div class="node" id="${elemId}">
        <div class="node__content">
            <div class="node__title">Node ${node.id}</div>
            
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
        
        ${node.children ? renderTree(node.children, nodeValue) : ""}
    </div>`;
}

function renderTree (tree, input = null) {
    const treeHTML = tree.map((node) => renderNode(node, input)).flat().join("");

    return `<div class="nodes">${treeHTML}</div>`;
}

function onNodeChange (nodeId, newCode) {
    console.log("Node changed:", nodeId, newCode);
}

const tree = [ 
    {
        id: "1",
        code: `function add(a, b) {
    return a + b;
}

return add(10, 20);`,
        isChildren: false,
        children: [
            {
                id: "1.1",
                code: "return $input * 2;",
                isChildren: true,
                children: []
            }
        ]
    } 
];

document.querySelector("#app").innerHTML = renderTree(tree);
