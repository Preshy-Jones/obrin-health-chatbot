# 🩸 Enhanced Menstrual Tracking Test Guide

## 🚀 **QUICK START**

### **1. Start the Server**

```bash
pnpm start:dev
```

### **2. Run Automated Tests**

```bash
node test-menstrual-tracking.js
```

### **3. Manual Testing via WhatsApp Webhook**

Use curl or Postman to send messages to: `http://localhost:3000/whatsapp/webhook`

## 📋 **TEST SCENARIOS**

### **🔧 SETUP PHASE**

#### **Test 1: Initial Period Recording**

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "My last period started 15/01/2024 and lasted 5 days with medium flow",
    "From": "whatsapp:+1234567890",
    "MessageSid": "test_001"
  }'
```

**Expected Response**: Confirmation of period recording + request for cycle length

#### **Test 2: Set Cycle Length**

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "My cycle is 28 days",
    "From": "whatsapp:+1234567890",
    "MessageSid": "test_002"
  }'
```

**Expected Response**: Cycle length confirmation + next period prediction with confidence

### **📊 PREDICTION PHASE**

#### **Test 3: Ask About Next Period**

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "When is my next period?",
    "From": "whatsapp:+1234567890",
    "MessageSid": "test_003"
  }'
```

**Expected Response**: Next period date + confidence level + fertility window

#### **Test 4: Ask About Fertility**

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "When is my fertility window?",
    "From": "whatsapp:+1234567890",
    "MessageSid": "test_004"
  }'
```

**Expected Response**: Fertility window dates (ovulation period)

### **⚙️ CUSTOMIZATION PHASE**

#### **Test 5: Update Period Length**

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "My period length is 4 days",
    "From": "whatsapp:+1234567890",
    "MessageSid": "test_005"
  }'
```

**Expected Response**: Period length confirmation

#### **Test 6: Set Flow Intensity**

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "My flow is heavy",
    "From": "whatsapp:+1234567890",
    "MessageSid": "test_006"
  }'
```

**Expected Response**: Flow intensity confirmation

#### **Test 7: Configure Reminders**

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "Set my reminders to 5 days before",
    "From": "whatsapp:+1234567890",
    "MessageSid": "test_007"
  }'
```

**Expected Response**: Reminder setting confirmation

### **🔄 ADVANCED FEATURES**

#### **Test 8: Historical Data Analysis**

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "My last period started 10/12/2023, 15/01/2024, and 12/02/2024",
    "From": "whatsapp:+1234567890",
    "MessageSid": "test_008"
  }'
```

**Expected Response**: Pattern recognition + improved confidence

#### **Test 9: Confidence Query**

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "What is the confidence level of my prediction?",
    "From": "whatsapp:+1234567890",
    "MessageSid": "test_009"
  }'
```

**Expected Response**: Confidence percentage explanation

## 🎯 **FEATURES TO VERIFY**

### **✅ Enhanced Data Collection**

- [ ] Period date recording
- [ ] Period length tracking (2-10 days)
- [ ] Flow intensity (Light/Medium/Heavy)
- [ ] Cycle length setting
- [ ] Historical data storage

### **✅ Smart Predictions**

- [ ] Next period prediction with confidence levels
- [ ] Fertility window calculation
- [ ] Pattern recognition from historical data
- [ ] Adaptive confidence based on data points

### **✅ Customization Options**

- [ ] Reminder settings (1-7 days before)
- [ ] Enable/disable reminders
- [ ] Period length preferences
- [ ] Flow intensity tracking

### **✅ User Experience**

- [ ] Natural language understanding
- [ ] Helpful guidance messages
- [ ] Emoji usage for warmth
- [ ] Clear confirmation messages

## 🐛 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Server Not Running**

```bash
# Check if server is running
curl http://localhost:3000/health

# Start server if needed
pnpm start:dev
```

#### **2. Database Migration Issues**

```bash
# Reset database if needed
npx prisma migrate reset

# Apply migrations
npx prisma migrate dev
```

#### **3. TypeScript Errors**

```bash
# Check for compilation errors
pnpm build

# Fix any type issues in the code
```

### **Debug Mode**

Add these environment variables to see detailed logs:

```bash
DEBUG=* pnpm start:dev
```

## 📊 **EXPECTED RESPONSES**

### **Sample Successful Responses**

#### **Period Recording**

```
Thanks! I've recorded your last period as 1/15/2024.

What's your average cycle length (days between periods)? This helps me predict your next period more accurately.
```

#### **Enhanced Prediction**

```
Based on your cycle data, your next period is expected in about 12 days (around 2/12/2024).

Confidence: 85% 📊

🌱 Fertility window: 1/29/2024 - 2/1/2024

I'll send you a reminder 3 days before! 📅
```

#### **Customization Confirmation**

```
Perfect! I've set your average period length to 4 days. This helps me provide more accurate predictions! 📊
```

## 🎉 **SUCCESS CRITERIA**

The enhanced menstrual tracking feature is working correctly if:

1. ✅ **Data Collection**: All period data is properly stored
2. ✅ **Predictions**: Next period predictions include confidence levels
3. ✅ **Fertility**: Fertility windows are calculated and displayed
4. ✅ **Customization**: All settings can be modified
5. ✅ **User Experience**: Responses are helpful and warm
6. ✅ **Integration**: Works seamlessly with the main chatbot

## 🚀 **NEXT STEPS**

After testing, consider implementing:

1. **Scheduled Reminders**: Actual reminder sending system
2. **Machine Learning**: More sophisticated prediction algorithms
3. **Symptom Tracking**: Integration with period symptoms
4. **Analytics Dashboard**: User insights and patterns
5. **Mobile App**: Native mobile experience

---

**Happy Testing! 🌸**
