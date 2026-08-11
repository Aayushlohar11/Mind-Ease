# 📧 Resend Email OTP Setup Guide

## ✨ Your Email-OTP Authentication is Ready!

Your login and signup pages have been updated to use **Email-OTP authentication** instead of passwords. This is more secure and provides a better user experience.

---

## 🚀 Quick Start (Development Mode)

### **Option 1: Test Without Email Service (Console Mode)**

The app works immediately without any setup! OTP codes are printed to your terminal/console.

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Go to login/signup:**
   - Visit http://localhost:3001/auth/login
   - Enter your email
   - Click "Continue with email"

3. **Check your console:**
   - Look for the OTP code in your terminal
   - Copy the 6-digit code
   - Enter it on the verification page

**Example console output:**
```
============================================================
📧 OTP EMAIL (Development Mode)
============================================================
To: user@example.com
Purpose: login
Code: 123456
Expires: 1/15/2026, 10:30:00 AM
============================================================
```

---

## 📬 Option 2: Setup Resend for Real Emails

To send actual emails instead of console output:

### **Step 1: Create Resend Account**

1. Go to [Resend.com](https://resend.com)
2. Sign up for a free account
3. Free tier includes **3,000 emails/month** (perfect for testing!)

### **Step 2: Get API Key**

1. Log in to your Resend dashboard
2. Navigate to [API Keys](https://resend.com/api-keys)
3. Click "Create API Key"
4. Give it a name (e.g., "Mind Ease Dev")
5. Copy the API key (starts with `re_...`)

### **Step 3: Add to Your App**

1. Open `.env.local` file in your project root
2. Find the line: `RESEND_API_KEY=`
3. Add your API key:
   ```env
   RESEND_API_KEY=re_abc123xyz...
   ```
4. Save the file

### **Step 4: Restart Server**

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### **Step 5: Test It!**

1. Go to http://localhost:3001/auth/login
2. Enter your email
3. Check your email inbox for the OTP code
4. Enter the code and you're in!

---

## 🎨 What's New

### **Beautiful OTP Input**
- 6-digit code input with auto-focus
- Paste support (copy-paste entire code)
- Keyboard navigation (arrow keys, backspace)
- Visual feedback (focus, error states)
- Auto-submit when complete

### **Email Templates**
- Professional HTML email design
- Glassmorphism style matching your app
- Clear code display
- Security warnings
- Expiration notice

### **Security Features**
- ✅ 10-minute code expiration
- ✅ Maximum 5 attempts per code
- ✅ Rate limiting (1 minute between requests)
- ✅ Automatic cleanup of expired codes
- ✅ No passwords to store or hash

---

## 📊 How It Works

### **Login Flow:**
```
1. User enters email
   ↓
2. System generates 6-digit OTP
   ↓
3. OTP sent via email (or console in dev mode)
   ↓
4. User enters OTP
   ↓
5. System verifies OTP
   ↓
6. User logged in (JWT token issued)
```

### **Signup Flow:**
```
1. User enters name + email
   ↓
2. System generates 6-digit OTP
   ↓
3. OTP sent via email
   ↓
4. User enters OTP
   ↓
5. System verifies OTP
   ↓
6. Account created + logged in
```

---

## 🔧 API Endpoints

### **POST /api/auth/otp/send**
Send OTP to email

**Request:**
```json
{
  "email": "user@example.com",
  "purpose": "login" // or "signup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 10
}
```

### **POST /api/auth/otp/verify**
Verify OTP and login/signup

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "purpose": "login", // or "signup"
  "name": "John Doe" // only for signup
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token_here"
}
```

---

## ⚙️ Configuration

### **OTP Settings** (in `backend/services/otp.service.ts`)

```typescript
const OTP_LENGTH = 6                  // Length of OTP code
const OTP_EXPIRY_MINUTES = 10         // Code expires after 10 minutes
const MAX_ATTEMPTS = 5                // Max verification attempts
const RATE_LIMIT_MINUTES = 1          // Cooldown between requests
```

### **Email Sender** (for production)

Update in `backend/services/otp.service.ts`:
```typescript
from: 'Mind Ease <noreply@yourdomain.com>'  // Change this
```

**Important:** For production, you need to verify your domain with Resend:
1. Go to Resend dashboard → Domains
2. Add your domain
3. Add DNS records as instructed
4. Wait for verification (usually a few minutes)

---

## 🎨 Customization

### **Change OTP Email Design**

Edit the HTML template in `backend/services/otp.service.ts`:
- Colors and gradients
- Logo and branding
- Text content
- Layout structure

### **Change OTP Input Style**

Edit `frontend/components/OTPInput.tsx`:
- Input size and spacing
- Colors and borders
- Animation effects
- Focus states

### **Change Page Layout**

Edit the auth pages:
- `frontend/pages/auth/login/page.tsx`
- `frontend/pages/auth/signup/page.tsx`

---

## 🔒 Security Best Practices

### **For Development:**
- ✅ Console mode is fine (codes in terminal)
- ✅ Use test emails
- ✅ Short expiration times

### **For Production:**
- ✅ Use Redis/database for OTP storage (instead of in-memory)
- ✅ Implement IP-based rate limiting
- ✅ Add CAPTCHA for high-volume signup
- ✅ Monitor for abuse patterns
- ✅ Use verified domain for emails
- ✅ Log authentication attempts
- ✅ Add 2FA options (SMS, authenticator app)

---

## 🐛 Troubleshooting

### **OTP not appearing in console:**
- Check that `RESEND_API_KEY` is **not set** in `.env.local`
- Restart your development server
- Look for console logs starting with `📧 OTP EMAIL`

### **Emails not being sent:**
- Verify `RESEND_API_KEY` is correct in `.env.local`
- Check Resend dashboard for error logs
- Verify email is not in spam folder
- Check Resend free tier limits (3,000/month)

### **"Too many requests" error:**
- Wait 1 minute between OTP requests
- This is rate limiting working correctly

### **OTP expired:**
- Codes expire after 10 minutes
- Request a new code

### **OTP invalid:**
- Double-check the 6-digit code
- Code is case-sensitive (numbers only)
- Maximum 5 attempts before needing new code

---

## 📦 Files Created/Modified

### **New Files:**
```
backend/services/otp.service.ts         - OTP generation and email sending
app/api/auth/otp/send/route.ts          - Send OTP API endpoint
app/api/auth/otp/verify/route.ts        - Verify OTP API endpoint
frontend/components/OTPInput.tsx         - Beautiful OTP input component
frontend/pages/auth/login/page.tsx       - Updated with OTP flow
frontend/pages/auth/signup/page.tsx      - Updated with OTP flow
RESEND_SETUP_GUIDE.md                    - This guide
```

### **Modified Files:**
```
.env.local                               - Added RESEND_API_KEY
package.json                             - Added resend package
```

---

## 📚 Resources

- **Resend Documentation:** https://resend.com/docs
- **Resend API Reference:** https://resend.com/docs/api-reference
- **Resend Dashboard:** https://resend.com/overview
- **Email Best Practices:** https://resend.com/docs/knowledge-base/email-best-practices

---

## 🎉 You're All Set!

Your app now has **modern, secure, passwordless authentication** with email OTP!

### **Test it now:**
1. **Start server:** `npm run dev`
2. **Open:** http://localhost:3001/auth/login
3. **Enter email** and get your OTP in the console
4. **Verify** and you're in!

### **Add Resend API key later:**
- When you're ready for production
- To send real emails during development
- See setup steps above

---

**Made with 💙 for Mind Ease**

*Your AI mental health companion*
