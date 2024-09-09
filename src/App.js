import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import './App.css';

const CROAK_TOKEN_ADDRESS = "0xaCb54d07cA167934F57F829BeE2cC665e1A5ebEF";
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1000;
const PIXEL_SIZE = 10;

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)"
];

export default function CroakCanvas() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [isEligible, setIsEligible] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [canvas, setCanvas] = useState({});
  const canvasRef = useRef(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        await checkEligibility(provider, accounts[0]);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const checkEligibility = async (provider, account) => {
    const croakContract = new ethers.Contract(CROAK_TOKEN_ADDRESS, ERC20_ABI, provider);
    const balance = await croakContract.balanceOf(account);
    setIsEligible(balance.gt(0));
  };

  const handleCanvasClick = (event) => {
    if (!isEligible) {
      alert("You must own CROAK tokens to place pixels.");
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / PIXEL_SIZE);

    setCanvas(prevCanvas => ({
      ...prevCanvas,
      [`${x},${y}`]: selectedColor
    }));
  };

  useEffect(() => {
    const drawCanvas = () => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid
      ctx.fillStyle = "#CCCCCC";
      for (let x = 0; x < CANVAS_WIDTH; x += PIXEL_SIZE) {
        for (let y = 0; y < CANVAS_HEIGHT; y += PIXEL_SIZE) {
          ctx.fillRect(x, y, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
        }
      }

      // Draw pixels
      Object.entries(canvas).forEach(([key, color]) => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillStyle = color;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
      });
    };

    drawCanvas();
  }, [canvas]);

  return (
    <div className="pixel-container">
      <h1 className="pixel-title">CroakCanvas</h1>
      <button className="connect-wallet" onClick={connectWallet}>
        {account ? `Connected: ${account.slice(0,6)}...${account.slice(-4)}` : "Connect Wallet"}
      </button>
      <p className="description">
        Welcome to CroakCanvas, where your artistic dreams go to croak. Paint pixels, waste time, and pretend you're making a difference in the blockchain world. It's like MS Paint, but with extra steps and a hefty gas fee. Enjoy!
      </p>
      <div className="pixel-info">
        <p>Address: {account || "Not connected"}</p>
        <p>Eligible to place pixels: {isEligible ? "Yes" : "No"}</p>
      </div>
      <input
        type="color"
        value={selectedColor}
        onChange={(e) => setSelectedColor(e.target.value)}
        className="pixel-color-picker"
      />
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="pixel-canvas"
        />
      </div>
    </div>
  );
}