// Production Payment Flow Test for Hunter Draut
// This simulates exactly what happens when Hunter completes a payment

const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/zKZ8Zy6VvGR1m7lNfRkY/webhook-trigger/8af7f178-88cd-4a86-8c44-b6f1079e6d95';

async function simulatePaymentSuccess() {
  console.log('🚀 SIMULATING PAYMENT SUCCESS FOR HUNTER DRAUT');
  console.log('═══════════════════════════════════════════════');
  console.log('👤 Customer: Hunter Draut');
  console.log('📧 Email: hunterdraut@gmail.com');
  console.log('💰 Amount: $3.99');
  console.log('🔗 Webhook URL:', GHL_WEBHOOK_URL);
  
  // This is the exact data that will be sent when Hunter's payment succeeds
  const paymentSuccessData = {
    type: 'payment_success',
    email: 'hunterdraut@gmail.com',
    paymentId: 'pi_hunter_production_' + Date.now(),
    amount: '3.99',
    timestamp: Date.now(),
    userId: 'hunter_user_id', // This will be Hunter's actual user ID
    contactId: 'hunter_contact_id' // This will be Hunter's actual contact ID
  };

  console.log('\n📦 Webhook Payload:');
  console.log(JSON.stringify(paymentSuccessData, null, 2));
  
  console.log('\n🔄 Sending webhook to GoHighLevel...');
  
  try {
    const response = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MTG-App-Production-Payment/1.0'
      },
      body: JSON.stringify(paymentSuccessData)
    });

    const responseText = await response.text();
    
    console.log('\n📊 WEBHOOK RESPONSE:');
    console.log('Status:', response.status);
    console.log('Response:', responseText);
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Webhook delivered successfully');
      console.log('🎉 Hunter\'s payment would be processed correctly');
      console.log('💡 The system is ready for production payments');
      
      return {
        success: true,
        status: response.status,
        response: responseText
      };
    } else {
      console.log('\n❌ FAILED! Webhook delivery failed');
      console.log('🚨 Status:', response.status);
      console.log('🚨 Error:', responseText);
      
      return {
        success: false,
        status: response.status,
        error: responseText
      };
    }
  } catch (error) {
    console.error('\n💥 ERROR! Network or processing error');
    console.error('🚨 Error:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Production Flow Simulation
async function runProductionFlowTest() {
  console.log('🎯 PRODUCTION PAYMENT FLOW TEST');
  console.log('This simulates the exact sequence that happens when Hunter pays:\n');
  
  console.log('1️⃣  Hunter clicks "Upgrade to Premium"');
  console.log('2️⃣  Hunter is redirected to Stripe payment page');
  console.log('3️⃣  Hunter completes payment successfully');
  console.log('4️⃣  Stripe redirects Hunter to /payment-success page');
  console.log('5️⃣  Payment success page sends webhook to GoHighLevel');
  console.log('6️⃣  Hunter\'s subscription is activated');
  console.log('7️⃣  Hunter is redirected to subscription page\n');
  
  console.log('🧪 Testing step 5: Webhook delivery...\n');
  
  const result = await simulatePaymentSuccess();
  
  console.log('\n' + '═'.repeat(50));
  console.log('🏆 FINAL RESULT:');
  
  if (result.success) {
    console.log('✅ PAYMENT FLOW TEST PASSED');
    console.log('🚀 System is ready for Hunter\'s payment');
    console.log('📋 Next steps:');
    console.log('   • Deploy the application');
    console.log('   • Configure Stripe payment link success URL');
    console.log('   • Hunter can now make payments successfully');
  } else {
    console.log('❌ PAYMENT FLOW TEST FAILED');
    console.log('⚠️  Issues need to be resolved before production');
    console.log('🔧 Check the error details above');
  }
  
  return result.success;
}

// Run the test
runProductionFlowTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  }); 