# CEE Lab Equipment Inventory Management System

A comprehensive web-based inventory management system designed for Civil and Environmental Engineering (CEE) laboratories. This system allows efficient tracking, management, and documentation of laboratory equipment with advanced features including QR code generation, barcode support, and detailed reporting.

## 🚀 Live Demo

**Deployed on Render**: [CEE Lab Inventory](https://cee-lab-inventory.onrender.com)

## ✨ Features

### � Equipment Management
- **Add/Edit Equipment**: Complete equipment information entry with validation
- **Image Upload**: Equipment photos with drag-and-drop support
- **Search & Filter**: Advanced filtering by lab, status, category, and search terms
- **Status Tracking**: Monitor equipment condition (Healthy, Damaged, Troubleshooting, etc.)

### 🏷️ Advanced Identification
- **FIU ID Support**: University asset tracking integration
- **Barcode Generation**: CODE128 barcodes for FIU IDs
- **Model Numbers**: Detailed equipment model tracking
- **Serial Numbers**: Unique equipment identification

### 📱 QR Code & Manual Management
- **Manual Links**: Direct links to equipment documentation
- **QR Code Generation**: Scannable codes for mobile access to manuals
- **Multiple Fallbacks**: Robust QR generation with offline support
- **Printable Labels**: Professional equipment labels with QR codes

### 📊 Reporting & Export
- **Word Export**: Detailed equipment reports
- **Excel Export**: Spreadsheet format for data analysis
- **PDF Generation**: Professional documentation
- **Lab Summaries**: Equipment counts and value calculations

### 💾 Data Management
- **SQLite Database**: Lightweight, reliable data storage
- **Optional Fields**: Flexible data entry (buying date and price optional)
- **Data Migration**: Seamless database updates
- **Backup Support**: Easy data export/import

## 🛠️ Technology Stack

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web application framework
- **SQLite3**: Database management
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing

### Frontend
- **HTML5**: Modern web standards
- **CSS3**: Responsive design with Material Icons
- **Vanilla JavaScript**: No framework dependencies
- **QRCode.js**: QR code generation
- **JsBarcode**: Barcode generation

### Deployment
- **Render**: Cloud hosting platform
- **GitHub**: Version control and CI/CD

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AbbasSharifi16/CEE-Lab-Inventory.git
   cd CEE-Lab-Inventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

### Development Mode
```bash
npm run dev
```
This starts the server with nodemon for automatic restarts on file changes.

## 📁 Project Structure

```
CEE-Lab-Inventory/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── index.html                # Frontend interface
├── script.js                 # Frontend JavaScript
├── styles.css                # Frontend styling
├── simple-qr.js             # QR code fallback generator
├── equipment.db              # SQLite database (auto-created)
├── uploads/                  # Equipment images storage
└── README.md                 # This file
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (production/development)

### Database
The application uses SQLite for data storage. The database file (`equipment.db`) is automatically created on first run with the following schema:

- **Equipment Table**: Main equipment information
- **Auto-generated columns**: id, created_at, updated_at
- **Required fields**: name, category, lab, serialNumber, quantity, status
- **Optional fields**: model, fiuId, buyingDate, price, notes, image, manualLink

## 📖 Usage Guide

### Adding Equipment
1. Click "Add Equipment" button
2. Fill in required fields (marked with *)
3. Optionally add model, FIU ID, buying date, price
4. Upload equipment image (optional)
5. Add manual link for QR code generation
6. Save equipment

### Managing Equipment
1. Click on any equipment card to edit
2. Update information as needed
3. Generate and print QR codes for physical labeling
4. Track equipment status and condition

### Generating Reports
1. Use filter options to select equipment
2. Click "Export to Word/Excel/PDF"
3. Professional reports with lab summaries
4. Equipment counts and total values

### QR Code Features
1. Add manual links to equipment
2. QR codes auto-generate for mobile access
3. Print professional equipment labels
4. Scan with phone camera to access manuals

## 🚀 Deployment on Render

### Automatic Deployment
This repository is configured for automatic deployment on Render:

1. **Fork this repository**
2. **Connect to Render**:
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub account
   - Select this repository
3. **Configure deployment**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node.js
4. **Deploy**: Automatic deployment on every commit

### Manual Deployment
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure build settings:
   ```
   Build Command: npm install
   Start Command: npm start
   ```
4. Deploy and access your live application

## 📊 API Endpoints

### Equipment Management
- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/:id` - Get specific equipment
- `POST /api/equipment` - Add new equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment

### File Management
- `POST /uploads` - Upload equipment images
- `GET /uploads/:filename` - Serve uploaded images

## 🛡️ Security Features

- Input validation and sanitization
- File upload restrictions (images only)
- SQL injection prevention
- XSS protection
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Abbas Sharifi** - *Initial work* - [AbbasSharifi16](https://github.com/AbbasSharifi16)

## 🙏 Acknowledgments

- Civil and Environmental Engineering Department
- Florida International University
- Open source community for tools and libraries

## 📞 Support

For support, email asharifi@fiu.edu or create an issue in the GitHub repository.

---

**Built with ❤️ for the CEE Lab Community**
