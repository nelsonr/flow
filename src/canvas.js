import { pipe, map, flatMap } from "./utils";

const getNodesCoordinates = map((node) => {
    const nodeEl = document.querySelector(`[data-id="${node.id}"] .node__content`);
    const children = node.children.length > 0 ? getNodesCoordinates(node.children) : [];
    const inputRect = nodeEl.querySelector(".node__editor").getBoundingClientRect();
    const outputRect = nodeEl.querySelector(".node__output").getBoundingClientRect();

    return {
        id: node.id,
        coords: {
            input: [ 
                inputRect.x, 
                inputRect.y + inputRect.height / 2 
            ],
            output: [ 
                outputRect.x + outputRect.width, 
                outputRect.y + outputRect.height / 2 
            ],
        },
        children: children
    };
});

const getNodesConnections = flatMap((node) => {
    const connectNodes = map((childNode) => 
        [ ...node.coords.output, ...childNode.coords.input ]
    );
    
    return connectNodes(node.children).concat(getNodesConnections(node.children));
});

export const getConnections = pipe(getNodesCoordinates, getNodesConnections);

export function renderNodesConnections (nodes) {
    const rootEl = document.querySelector("#app");
    const rootOffset = rootEl.getBoundingClientRect();

    let canvas = document.querySelector("canvas");

    if (!canvas) {
        canvas = document.createElement("canvas");
        rootEl.appendChild(canvas);
    }
    
    canvas.width = rootEl.clientWidth;
    canvas.height = rootEl.clientHeight;

    const connections = getConnections(nodes);
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#FFF";
    ctx.fillStyle = "#FFF";
    
    connections.forEach(([ x1, y1, x2, y2 ]) => {
        ctx.beginPath();
        ctx.moveTo(x1 - rootOffset.left, y1 - rootOffset.top);
        ctx.lineTo(x2 - rootOffset.left, y2 - rootOffset.top);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(x1 - rootOffset.left, y1 - rootOffset.top, 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x2 - rootOffset.left, y2 - rootOffset.top, 2, 0, 2 * Math.PI);
        ctx.fill();
    });
}
