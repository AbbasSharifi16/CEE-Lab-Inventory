# CEE Lab Equipment Manager - Backend Setup

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (version 14 or higher) - Download from [nodejs.org](https://nodejs.org/)

### Installation Steps

1. **Open Command Prompt/Terminal**
   - Navigate to your project folder:
   ```bash
   cd "C:\Users\Abbas\Documents\lab_manager_app\CEE_Lab_APP"
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Open your browser and go to: `http://localhost:3000`
   - Your lab equipment manager is now running with a real database!

### 🔧 Development Mode
For development with auto-restart on file changes:
```bash
npm run dev
```

## 📊 Database Information

- **Type**: SQLite (file-based database)
- **File**: `equipment.db` (created automatically)
- **Initial Data**: Imported from your existing `data.js` file
- **Images**: Stored in `uploads/` folder

## ✨ Features

### Dynamic Operations
- ✅ **Add Equipment**: Real-time addition to database
- ✅ **Search & Filter**: Instant database queries
- ✅ **Image Upload**: File storage with preview
- ✅ **Data Persistence**: All changes saved permanently
- ✅ **API Backend**: RESTful API for all operations

### API Endpoints
- `GET /api/equipment` - Get all equipment (with filters)
- `POST /api/equipment` - Add new equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment
- `GET /api/equipment/:id` - Get single equipment

## 🌐 Deployment to Web Host

1. **Upload Files**: Upload all files to your web hosting provider
2. **Install Node.js**: Ensure your host supports Node.js
3. **Install Dependencies**: Run `npm install` on the server
4. **Start Application**: Use `npm start` or your host's deployment method
5. **Database**: The SQLite file will be created automatically

## 🔧 Troubleshooting

### Server Won't Start
- Check if Node.js is installed: `node --version`
- Ensure you're in the correct directory
- Check if port 3000 is available

### Database Issues
- Database file is created automatically
- Initial data is imported from `data.js`
- Check console for error messages

### Image Upload Issues
- Ensure `uploads/` folder exists (created automatically)
- Check file size limits (10MB max)
- Only image files are accepted

## 📱 Usage

1. **Start Server**: `npm start`
2. **Open Browser**: Go to `http://localhost:3000`
3. **Add Equipment**: Use the "Add New Equipment" button
4. **View Changes**: Equipment appears immediately
5. **Search/Filter**: All features work with live database
6. **Restart**: Data persists between server restarts

Your lab equipment manager now has a proper backend database system!
