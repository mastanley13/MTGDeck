import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCardImageUris } from '../../utils/scryfallAPI';

const CardDebugger = () => {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cardName, setCardName] = useState('A-Gutter Skulker');
  const [imageUrisResult, setImageUrisResult] = useState(null);

  const testCards = [
    'A-Gutter Skulker',
    'Arlinn, the Pack\'s Hope',
    'Arcee, Sharpshooter',
    'Aether Shockwave',
    'Aftershock'
  ];

  const testGetCardImageUris = (card) => {
    if (!card) return null;

    console.log('🔧 Manual testing of getCardImageUris logic...');
    
    // Test step 1: Direct image_uris
    const directTest = card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal || card.image_uris?.small;
    console.log('Step 1 - Direct image_uris test:', directTest);
    
    if (directTest) {
      console.log('✅ Direct image_uris found:', card.image_uris);
      return {
        source: 'direct',
        result: card.image_uris
      };
    }
    
    // Test step 2: Card faces
    if (card.card_faces && card.card_faces[0]?.image_uris) {
      const faceTest = card.card_faces[0].image_uris.png || card.card_faces[0].image_uris.large || card.card_faces[0].image_uris.normal || card.card_faces[0].image_uris.small;
      console.log('Step 2 - Card faces[0] test:', faceTest);
      
      if (faceTest) {
        console.log('✅ Card faces[0] image_uris found:', card.card_faces[0].image_uris);
        return {
          source: 'face0',
          result: card.card_faces[0].image_uris
        };
      }
    }
    
    // Test other faces
    if (card.card_faces && card.card_faces.length > 1) {
      for (let i = 1; i < card.card_faces.length; i++) {
        const face = card.card_faces[i];
        if (face?.image_uris) {
          const faceTest = face.image_uris.png || face.image_uris.large || face.image_uris.normal || face.image_uris.small;
          console.log(`Step 3 - Card faces[${i}] test:`, faceTest);
          
          if (faceTest) {
            console.log(`✅ Card faces[${i}] image_uris found:`, face.image_uris);
            return {
              source: `face${i}`,
              result: face.image_uris
            };
          }
        }
      }
    }
    
    console.log('❌ No image URIs found in manual test');
    return {
      source: 'none',
      result: null
    };
  };

  const fetchCard = async (name) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.scryfall.com/cards/named`, {
        params: { fuzzy: name }
      });
      setCardData(response.data);
      console.log('Raw card data for', name, ':', response.data);
      
      // Test our function
      const imageUris = getCardImageUris(response.data);
      console.log('getCardImageUris result:', imageUris);
      
      // Manual testing
      const manualTest = testGetCardImageUris(response.data);
      console.log('Manual test result:', manualTest);
      
      setImageUrisResult({
        automatic: imageUris,
        manual: manualTest
      });
    } catch (error) {
      console.error('Error fetching card:', error);
      setCardData({ error: error.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCard(cardName);
  }, [cardName]);

  return (
    <div className="p-4 bg-gray-800 rounded-lg max-w-6xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">Card Image Debugger</h2>
      
      <div className="mb-4">
        <label className="block text-white mb-2">Test Card:</label>
        <select 
          value={cardName} 
          onChange={(e) => setCardName(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded"
        >
          {testCards.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-white">Loading...</div>}

      {cardData && !cardData.error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Card Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Card Info:</h3>
              <div className="bg-gray-700 p-2 rounded text-sm text-gray-200">
                <p><strong>Name:</strong> {cardData.name}</p>
                <p><strong>Layout:</strong> {cardData.layout}</p>
                <p><strong>Has image_uris:</strong> {cardData.image_uris ? 'Yes' : 'No'}</p>
                <p><strong>Has card_faces:</strong> {cardData.card_faces ? 'Yes' : 'No'}</p>
                <p><strong>Card faces count:</strong> {cardData.card_faces ? cardData.card_faces.length : 0}</p>
                <p><strong>Image status:</strong> {cardData.image_status || 'N/A'}</p>
              </div>
            </div>

            {imageUrisResult && (
              <div>
                <h3 className="text-lg font-semibold text-white">Function Results:</h3>
                <div className="bg-gray-700 p-2 rounded text-sm text-gray-200">
                  <p><strong>getCardImageUris result:</strong> {imageUrisResult.automatic ? 'Found' : 'Not found'}</p>
                  <p><strong>Manual test result:</strong> {imageUrisResult.manual?.result ? `Found via ${imageUrisResult.manual.source}` : 'Not found'}</p>
                  
                  {imageUrisResult.automatic && (
                    <div className="mt-2">
                      <p><strong>Image URL selected:</strong></p>
                      <p className="text-xs text-green-400 break-all">
                        {imageUrisResult.automatic.normal || imageUrisResult.automatic.small || imageUrisResult.automatic.large || imageUrisResult.automatic.png}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {cardData.image_uris && (
              <div>
                <h3 className="text-lg font-semibold text-white">Direct image_uris:</h3>
                <pre className="bg-gray-700 p-2 rounded text-xs text-gray-200 overflow-auto max-h-40">
                  {JSON.stringify(cardData.image_uris, null, 2)}
                </pre>
              </div>
            )}

            {cardData.card_faces && (
              <div>
                <h3 className="text-lg font-semibold text-white">Card Faces:</h3>
                {cardData.card_faces.map((face, index) => (
                  <div key={index} className="bg-gray-700 p-2 rounded mb-2">
                    <p className="text-white"><strong>Face {index}: {face.name}</strong></p>
                    <p className="text-gray-300">Has image_uris: {face.image_uris ? 'Yes' : 'No'}</p>
                    {face.image_uris && (
                      <pre className="bg-gray-600 p-2 rounded text-xs text-gray-200 mt-2 overflow-auto max-h-32">
                        {JSON.stringify(face.image_uris, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Image Test */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Image Test:</h3>
              
              {imageUrisResult?.automatic && (
                <div className="bg-gray-700 p-4 rounded">
                  <p className="text-white mb-2"><strong>Testing our function result:</strong></p>
                  <img 
                    src={imageUrisResult.automatic.normal || imageUrisResult.automatic.small || imageUrisResult.automatic.large || imageUrisResult.automatic.png}
                    alt={cardData.name}
                    className="max-w-full h-auto rounded border"
                    onLoad={() => console.log('✅ Image loaded successfully!')}
                    onError={(e) => console.log('❌ Image failed to load:', e.target.src)}
                  />
                </div>
              )}

              {imageUrisResult?.manual?.result && (
                <div className="bg-gray-700 p-4 rounded mt-4">
                  <p className="text-white mb-2"><strong>Testing manual result ({imageUrisResult.manual.source}):</strong></p>
                  <img 
                    src={imageUrisResult.manual.result.normal || imageUrisResult.manual.result.small || imageUrisResult.manual.result.large || imageUrisResult.manual.result.png}
                    alt={cardData.name}
                    className="max-w-full h-auto rounded border"
                    onLoad={() => console.log('✅ Manual test image loaded successfully!')}
                    onError={(e) => console.log('❌ Manual test image failed to load:', e.target.src)}
                  />
                </div>
              )}

              {(!imageUrisResult?.automatic && !imageUrisResult?.manual?.result) && (
                <div className="bg-red-900 p-4 rounded">
                  <p className="text-red-200">No image URIs found by either method!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {cardData?.error && (
        <div className="text-red-400">Error: {cardData.error}</div>
      )}
    </div>
  );
};

export default CardDebugger; 