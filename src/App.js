import { useRef, useState, useEffect } from "react";

const App = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState(5);
  const [lineColor, setLineColor] = useState("black");
  const [lineOpacity, setLineOpacity] = useState(0.1);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = lineOpacity;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;

    // Save initial state to undo stack
    saveState();
  }, [lineColor, lineOpacity, lineWidth]);

  const saveState = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    setUndoStack((prev) => [...prev, dataUrl]);
  };

  const restoreState = (dataUrl) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      // Reset the canvas before restoring the image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Temporarily reset globalAlpha to avoid transparency stacking
      const currentAlpha = ctx.globalAlpha;
      ctx.globalAlpha = 1;
  
      ctx.drawImage(img, 0, 0);
  
      // Restore globalAlpha to its original value
      ctx.globalAlpha = currentAlpha;
    };
  };
  

  const startDrawing = (e) => {
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const endDrawing = () => {
    if (isDrawing) {
      ctxRef.current.closePath();
      setIsDrawing(false);
      saveState(); // Save state after completing a stroke
      setRedoStack([]); // Clear redo stack after a new drawing action
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctxRef.current.stroke();
  };

  const handleUndo = () => {
    if (undoStack.length > 1) {
      const newUndoStack = [...undoStack];
      const lastState = newUndoStack.pop();
      setRedoStack((prev) => [lastState, ...prev]);
      setUndoStack(newUndoStack);
      restoreState(newUndoStack[newUndoStack.length - 1]);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const newRedoStack = [...redoStack];
      const nextState = newRedoStack.shift();
      setRedoStack(newRedoStack);
      setUndoStack((prev) => [...prev, nextState]);
      restoreState(nextState);
    }
  };

  const StyledMenu = ({ className, children }) => (
    <div
      className={`${className} bg-gray-200/20 rounded-md p-4 mb-4 w-[650px] flex justify-evenly items-center`}
    >
      {children}
    </div>
  );

  const ErrorAlert = ({ children }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm">
      {children}
    </div>
  );

  const BrushSettingsForm = ({ setLineColor, setLineWidth, setLineOpacity }) => {
    const [formValues, setFormValues] = useState({
      color: "#000000",
      width: "5",
      opacity: "10",
    });
    const [errors, setErrors] = useState({});

    const validateForm = (name, value) => {
      switch (name) {
        case "width":
          return value >= 3 && value <= 20 ? "" : "Width must be between 3 and 20";
        case "opacity":
          return value >= 1 && value <= 100 ? "" : "Opacity must be between 1 and 100";
        default:
          return "";
      }
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      const error = validateForm(name, value);
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));

      if (!error) {
        switch (name) {
          case "color":
            setLineColor(value);
            break;
          case "width":
            setLineWidth(value);
            break;
          case "opacity":
            setLineOpacity(value / 100);
            break;
          default:
            console.warn(`Unhandled property: ${name}`);
            break;
        }
      }
    };

    return (
      <div className="space-y-4">
        <StyledMenu>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Brush Color</label>
            <input
              type="color"
              name="color"
              value={formValues.color}
              onChange={handleChange}
              className="h-8 w-16"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Brush Width ({formValues.width}px)
            </label>
            <input
              type="range"
              name="width"
              min="3"
              max="20"
              value={formValues.width}
              onChange={handleChange}
              className="w-32"
            />
            {errors.width && <ErrorAlert>{errors.width}</ErrorAlert>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Brush Opacity ({formValues.opacity}%)
            </label>
            <input
              type="range"
              name="opacity"
              min="1"
              max="100"
              value={formValues.opacity}
              onChange={handleChange}
              className="w-32"
            />
            {errors.opacity && <ErrorAlert>{errors.opacity}</ErrorAlert>}
          </div>
        </StyledMenu>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center">
      <h1 className="font-['Lobster'] text-5xl text-blue-600 my-6">Paint App</h1>
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
        <BrushSettingsForm
          setLineColor={setLineColor}
          setLineWidth={setLineWidth}
          setLineOpacity={setLineOpacity}
        />
        <div className="flex space-x-4 mb-4">
          <button
            onClick={handleUndo}
            className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            className="px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600"
          >
            Redo
          </button>
        </div>
        <canvas
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          onMouseMove={draw}
          ref={canvasRef}
          width={1280}
          height={720}
          className="border border-gray-200"
        />
      </div>
    </div>
  );
};

export default App;
