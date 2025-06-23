# CEE Lab Equipment Manager

A comprehensive web application for managing laboratory equipment across multiple CEE lab facilities.

## Features

### 🔍 **Search & Filter**
- Real-time search across equipment names, categories, serial numbers, and notes
- Filter by lab number (EC3625, EC3630, EC3760, EC3765, OU107, OU106)
- Filter by equipment status (Healthy, Damaged, Troubleshooting, Maintenance)
- Clear search functionality

### 📋 **Equipment Information**
Each equipment entry includes:
- Equipment name and photo
- Category and lab assignment
- Buying date and calculated age
- Serial number and quantity
- Purchase price
- Current status with visual indicators
- Detailed notes

### 👤 **Admin Features**
- Toggle admin mode for equipment management
- Change equipment status (Healthy, Damaged, Troubleshooting, Maintenance)
- Status updates with confirmation notifications

### 📄 **Reporting**
- Generate Word documents with equipment lists
- Select specific labs or all labs for reports
- Professional table format with all equipment details (excluding images)
- Automatic file naming with current date

### 🎨 **Modern Design**
- Google Material Design inspired interface
- Responsive layout for desktop and mobile
- Interactive cards with hover effects
- Professional color scheme and typography

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for loading external fonts and libraries)

### Installation
1. Download all files to a local directory
2. Open `index.html` in your web browser
3. No additional setup required!

### File Structure
```
CEE_Lab_APP/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and layout
├── script.js           # JavaScript functionality
├── data.js             # Equipment data and database
└── README.md           # This documentation
```

## Usage Guide

### Basic Navigation
1. **Search Equipment**: Use the search box to find specific equipment by name, serial number, or category
2. **Filter by Lab**: Select a specific lab from the dropdown to view only that lab's equipment
3. **Filter by Status**: Choose a status to see equipment in that condition
4. **View Details**: Click on any equipment card to see full details in a modal window

### Admin Functions
1. **Enable Admin Mode**: Click the "Admin Mode" button to enable status editing
2. **Change Status**: In equipment details modal, click "Change Status" button when admin mode is active
3. **Update Status**: Select new status from dropdown to immediately update equipment status

### Generate Reports
1. **Open Print Dialog**: Click the "Print Report" button
2. **Select Labs**: Choose which labs to include in the report
3. **Generate Document**: Click "Generate Word Document" to create and download the report
4. **File Download**: The Word document will automatically download with a timestamped filename

## Equipment Database

The application currently includes sample data for 20 equipment items across all 6 labs:

### Labs Included:
- **EC3625**: Electronics and measurement equipment
- **EC3630**: Signal processing and analysis tools
- **EC3760**: Environmental testing equipment
- **EC3765**: Fluid dynamics and materials testing
- **OU107**: Optical and sample preparation equipment
- **OU106**: Chemical analysis and sterilization equipment

### Status Categories:
- **Healthy**: Equipment is functioning normally
- **Damaged**: Equipment needs repair
- **Troubleshooting**: Equipment has known issues being investigated
- **Maintenance**: Equipment is scheduled for routine maintenance

## Customization

### Adding New Equipment
Edit the `data.js` file and add new equipment objects to the `equipmentData` array:

```javascript
{
    id: 21,                                    // Unique identifier
    name: "Equipment Name",                    // Display name
    category: "Equipment Category",            // Category classification
    lab: "EC3625",                            // Lab assignment
    buyingDate: "2023-06-13",                // Purchase date (YYYY-MM-DD)
    serialNumber: "SN-2023-001",             // Serial number
    quantity: 1,                              // Number of units
    price: 1000.00,                           // Purchase price
    status: "Healthy",                        // Current status
    notes: "Equipment description",           // Additional notes
    image: "https://example.com/image.jpg"    // Optional image URL
}
```

### Modifying Labs
To add or remove labs, update:
1. The lab dropdown options in `index.html`
2. The lab checkbox options in the print modal
3. Add corresponding equipment data in `data.js`

### Styling Changes
Modify `styles.css` to customize:
- Color scheme (CSS custom properties at the top)
- Layout and spacing
- Typography and fonts
- Component styling

## Technical Details

### Dependencies
- **External Libraries**:
  - Google Fonts (Roboto)
  - Material Icons
  - html2canvas (for potential future features)
  - docx library (for Word document generation)
  - FileSaver.js (for file downloads)

### Browser Compatibility
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### Performance
- Responsive design optimized for devices from 320px to 1200px+
- Debounced search for smooth performance
- Efficient filtering and rendering
- Minimal external dependencies

## Support

For technical issues or feature requests, please review the code comments and documentation within the source files.

## License

This project is designed for educational and internal use within CEE laboratory facilities.
