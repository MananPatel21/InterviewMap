import React, { useRef, useState, useEffect } from "react";
import "../assets/styles/Canvas.css";
import io from "socket.io-client";

const socket = io("https://interview-map.vercel.app");

export default function Canvas() {
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#00000");
    const [size, setSize] = useState("3");
    const canvasRef = useRef(null);
    const ctx = useRef(null);
    const timeout = useRef(null);
    const [cursor, setCursor] = useState("default");
    const socketRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        ctx.current = canvas.getContext("2d");

        //Resizing
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;

        socketRef.current = io("https://interview-map.vercel.app");

        // Listen for drawing events from other clients
        socketRef.current.on("drawing", async (data) => {
            console.log("drawing event litsened by client");
            // draw(data);
            const canvas = canvasRef.current;
            const { offsetX, offsetY, color, size } = await data;
            ctx.current.lineWidth = size;
            ctx.current.lineCap = "round";
            ctx.current.strokeStyle = color;

            ctx.current.lineTo(offsetX, offsetY);
            ctx.current.stroke();
            ctx.current.beginPath();
            ctx.current.moveTo(offsetX, offsetY);
        });

    }, []);

    const startPosition = ({ nativeEvent }) => {
        setIsDrawing(true);
        draw(nativeEvent);
    };

    const finishedPosition = () => {
        setIsDrawing(false);
        ctx.current.beginPath();
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) {
            console.log("not isdrawing");
            return;
        }
        const canvas = canvasRef.current;
        const { offsetX, offsetY } = nativeEvent;
        ctx.current.lineWidth = size;
        ctx.current.lineCap = "round";
        ctx.current.strokeStyle = color;

        ctx.current.lineTo(offsetX, offsetY);
        ctx.current.stroke();
        ctx.current.beginPath();
        ctx.current.moveTo(offsetX, offsetY);

        // Emit drawing data to the server
        socketRef.current.emit(
            "drawing",
            {
                offsetX,
                offsetY,
                color,
                size,
            },
            // console.log("emmiting event of drawing")
        );
    };

    const clearCanvas = () => {
        localStorage.removeItem("canvasimg");
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        //Passing clear screen
        if (timeout.current !== undefined) clearTimeout(timeout.current);
        timeout.current = setTimeout(function () {
            var base64ImageData = canvas.toDataURL("image/png");
            localStorage.setItem("canvasimg", base64ImageData);
        }, 400);
    };

    const getPen = () => {
        setCursor("default");
        setSize("3");
        setColor("#3B3B3B");
    };

    const eraseCanvas = () => {
        setCursor("grab");
        setSize("20");
        setColor("#FFFFFF");

        if (!isDrawing) {
            return;
        }
    };

    return (
        <>
            <div className="canvas-btn">
                <button onClick={getPen} className="btn-width">
                    Pencil
                </button>
                <div className="btn-width">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                </div>
                <div>
                    <select
                        className="btn-width"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                    >
                        <option> 1 </option>
                        <option> 3 </option>
                        <option> 5 </option>
                        <option> 10 </option>
                        <option> 15 </option>
                        <option> 20 </option>
                        <option> 25 </option>
                        <option> 30 </option>
                    </select>
                </div>
                <button onClick={clearCanvas} className="btn-width">
                    Clear
                </button>
                <div>
                    <button onClick={eraseCanvas} className="btn-width">
                        Eras
                    </button>
                </div>
            </div>
            <canvas
                style={{ cursor: cursor }}
                onMouseDown={startPosition}
                onMouseUp={finishedPosition}
                onMouseMove={draw}
                ref={canvasRef}
            />
        </>
    );
}
