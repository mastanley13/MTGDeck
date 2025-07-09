const https = require('https');

function fetchCard(cardName) {
  const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const card = JSON.parse(data);
          resolve(card);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function testCards() {
  const testCards = ['A-Gutter Skulker', 'Arlinn, the Pack\'s Hope', 'Arcee, Sharpshooter'];
  
  for (const cardName of testCards) {
    try {
      console.log(`\n=== Testing: ${cardName} ===`);
      const card = await fetchCard(cardName);
      
      console.log('Name:', card.name);
      console.log('Layout:', card.layout);
      console.log('Has image_uris:', !!card.image_uris);
      console.log('Has card_faces:', !!card.card_faces);
      console.log('Card faces count:', card.card_faces ? card.card_faces.length : 0);
      console.log('Image status:', card.image_status);
      
      if (card.image_uris) {
        console.log('Direct image_uris keys:', Object.keys(card.image_uris));
        console.log('PNG available:', !!card.image_uris.png);
        console.log('Large available:', !!card.image_uris.large);
        console.log('Normal available:', !!card.image_uris.normal);
      }
      
      if (card.card_faces) {
        card.card_faces.forEach((face, index) => {
          console.log(`Face ${index}:`, face.name);
          console.log(`Face ${index} has image_uris:`, !!face.image_uris);
          if (face.image_uris) {
            console.log(`Face ${index} image_uris keys:`, Object.keys(face.image_uris));
            console.log(`Face ${index} PNG:`, !!face.image_uris.png);
            console.log(`Face ${index} Large:`, !!face.image_uris.large);
            console.log(`Face ${index} Normal:`, !!face.image_uris.normal);
          }
        });
      }
      
    } catch (error) {
      console.error(`Error fetching ${cardName}:`, error.message);
    }
  }
}

testCards(); 