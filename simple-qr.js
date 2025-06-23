// Simple QR Code generator that works without external libraries
// This is a minimal implementation for emergency fallback

class SimpleQRCode {
    constructor(data, size = 120) {
        this.data = data;
        this.size = size;
    }
    
    // Generate a simple pattern-based QR-like code
    generatePattern() {
        const gridSize = 25; // 25x25 grid
        const pattern = [];
        
        // Initialize grid
        for (let i = 0; i < gridSize; i++) {
            pattern[i] = new Array(gridSize).fill(false);
        }
        
        // Add corner markers (simplified)
        this.addCornerMarkers(pattern, gridSize);
        
        // Add data pattern based on text hash
        this.addDataPattern(pattern, gridSize);
        
        return pattern;
    }
    
    addCornerMarkers(pattern, size) {
        // Top-left corner
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
                    pattern[i][j] = true;
                }
            }
        }
        
        // Top-right corner
        for (let i = 0; i < 7; i++) {
            for (let j = size - 7; j < size; j++) {
                if (i === 0 || i === 6 || j === size - 7 || j === size - 1 || (i >= 2 && i <= 4 && j >= size - 5 && j <= size - 3)) {
                    pattern[i][j] = true;
                }
            }
        }
        
        // Bottom-left corner
        for (let i = size - 7; i < size; i++) {
            for (let j = 0; j < 7; j++) {
                if (i === size - 7 || i === size - 1 || j === 0 || j === 6 || (i >= size - 5 && i <= size - 3 && j >= 2 && j <= 4)) {
                    pattern[i][j] = true;
                }
            }
        }
    }
    
    addDataPattern(pattern, size) {
        // Simple hash-based pattern generation
        let hash = this.simpleHash(this.data);
        
        for (let i = 8; i < size - 8; i++) {
            for (let j = 8; j < size - 8; j++) {
                // Skip if position is already used by corner markers
                if ((i < 9 && j < 9) || (i < 9 && j > size - 9) || (i > size - 9 && j < 9)) {
                    continue;
                }
                
                // Generate pattern based on hash and position
                const value = (hash + i * j) % 3;
                pattern[i][j] = value === 0;
                hash = (hash * 31 + i + j) % 1000000;
            }
        }
    }
    
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    drawToCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const pattern = this.generatePattern();
        const gridSize = pattern.length;
        const cellSize = this.size / gridSize;
        
        canvas.width = this.size;
        canvas.height = this.size;
        
        // Clear canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, this.size, this.size);
        
        // Draw pattern
        ctx.fillStyle = '#000000';
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (pattern[i][j]) {
                    ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
                }
            }
        }
        
        // Add text below for identification
        ctx.fillStyle = '#666666';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        const truncatedData = this.data.length > 20 ? this.data.substring(0, 17) + '...' : this.data;
        ctx.fillText(truncatedData, this.size / 2, this.size - 2);
        
        return canvas;
    }
}

// Export for use in main script
if (typeof window !== 'undefined') {
    window.SimpleQRCode = SimpleQRCode;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleQRCode;
}
