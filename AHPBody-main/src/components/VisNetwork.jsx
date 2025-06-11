import React, { useEffect, useRef } from "react";
import { Network, DataSet } from "vis-network/standalone";

const VisNetwork = ({ nodes, edges }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      console.error("VisNetwork: Container ref is not initialized.");
      return;
    }

    if (!nodes || !edges) {
      console.warn("VisNetwork: Nodes or edges are undefined or empty.");
      return;
    }

    try {
      const options = {
        layout: {
          hierarchical: {
            direction: "UD", // Up-Down direction
            sortMethod: "directed", // Follows edge directions
            nodeSpacing: 150, // Tăng khoảng cách ngang giữa các nodes
            levelSeparation: 100, // Tăng khoảng cách dọc giữa các tầng
          },
        },
        nodes: {
          shape: "box",
          color: {
            background: "#e6f0fa", // Light blue background
            border: "#4682b4", // Blue border
          },
          font: { size: 10, color: "#333" },
          widthConstraint: { minimum: 80, maximum: 80 }, // Giảm chiều rộng
          heightConstraint: { minimum: 30 }, // Giảm chiều cao
        },
        edges: {
          arrows: { to: { enabled: true, type: "arrow" } },
          color: "#000",
          width: 1,
        },
        physics: false, // Disable physics for hierarchical layout
      };

      console.log("VisNetwork: Initializing with nodes:", nodes.get(), "edges:", edges.get());

      const network = new Network(containerRef.current, { nodes, edges }, options);

      return () => {
        console.log("VisNetwork: Cleaning up network instance.");
        network.destroy();
      };
    } catch (error) {
      console.error("VisNetwork: Error initializing network:", error);
    }
  }, [nodes, edges]);

  return (
    <div
      ref={containerRef}
      style={{ height: "60vh", width: "70vw", border: "1px solid black" }}
    />
  );
};

export default VisNetwork;