# Deployment Guide for CEE Lab Equipment Inventory

## 🚀 Deploy to Render (Recommended)

### Step 1: Prepare Repository
✅ **COMPLETED** - Repository is ready at: https://github.com/AbbasSharifi16/CEE-Lab-Inventory.git

### Step 2: Deploy to Render

1. **Sign up/Login to Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select the repository: `AbbasSharifi16/CEE-Lab-Inventory`

3. **Configure Deployment Settings**
   ```
   Name: cee-lab-inventory (or your preferred name)
   Environment: Node
   Region: Choose closest to your location
   Branch: main
   Build Command: npm install
   Start Command: npm start
   ```

4. **Advanced Settings (Optional)**
   ```
   Node Version: 18.x (or latest stable)
   Environment Variables: 
   - NODE_ENV=production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment (usually 2-5 minutes)
   - Your app will be live at: `https://your-app-name.onrender.com`

### Step 3: First-Time Setup

After deployment:
1. **Visit your live URL**
2. **Add initial equipment** or **import existing data**
3. **Test all features**: QR codes, image uploads, reports
4. **Share URL** with your team

## 🔧 Alternative Deployment Options

### Deploy to Railway
1. Visit [railway.app](https://railway.app)
2. Connect GitHub account
3. Deploy from repository
4. Configure start command: `npm start`

### Deploy to Heroku
1. Install Heroku CLI
2. Run:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

### Deploy to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Import project from GitHub
3. Configure for Node.js application

## 📋 Production Checklist

### Before Going Live:
- [ ] Repository pushed to GitHub ✅
- [ ] Database schema is correct ✅
- [ ] All features tested locally ✅
- [ ] Environment variables configured
- [ ] SSL/HTTPS enabled (automatic on Render)

### After Deployment:
- [ ] Test all CRUD operations
- [ ] Verify image uploads work
- [ ] Test QR code generation
- [ ] Check barcode functionality
- [ ] Verify export features (Word, Excel, PDF)
- [ ] Test on mobile devices
- [ ] Set up regular backups

## 🔒 Security Notes

### For Production:
1. **Database**: SQLite is suitable for small-medium teams
2. **File Uploads**: Limited to images, size restricted
3. **HTTPS**: Automatically enabled on Render
4. **No Authentication**: Consider adding if needed for security

### Add Authentication (Optional):
If you need user authentication, consider:
- Implementing simple login system
- Using OAuth (Google, GitHub)
- Adding role-based permissions

## 📊 Monitoring & Maintenance

### Monitor Your App:
1. **Render Dashboard**: Check logs and metrics
2. **Application Health**: Monitor response times
3. **Database Size**: Track growth over time
4. **Storage Usage**: Monitor image uploads

### Regular Maintenance:
1. **Backup Database**: Export equipment data regularly
2. **Update Dependencies**: Keep packages current
3. **Monitor Logs**: Check for errors or issues
4. **Test Features**: Regularly verify all functionality

## 🆘 Troubleshooting

### Common Issues:

**Build Failed:**
- Check `package.json` dependencies
- Verify Node.js version compatibility
- Check build logs for specific errors

**Database Issues:**
- SQLite file permissions
- Database migration needed
- Check server logs

**Image Upload Problems:**
- File size limits
- Allowed file types
- Storage space

**QR Code Not Working:**
- External library loading
- Fallback mechanisms
- Browser compatibility

### Getting Help:
1. **Check Render Logs**: Application → View Logs
2. **GitHub Issues**: Create issue with error details
3. **Documentation**: Refer to README.md
4. **Contact**: asharifi@fiu.edu

## 🎉 Success!

Once deployed, your CEE Lab Equipment Inventory will be accessible to your team from anywhere with an internet connection.

**Your live application URL will be:**
`https://your-app-name.onrender.com`

Share this URL with your team members for instant access to the equipment management system!
