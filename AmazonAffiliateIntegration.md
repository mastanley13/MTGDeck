# 🛠️ Integration Instructions: Add Amazon Affiliate Button to Card Detail Modal

## 🎯 Goal
Add a button inside the Card Detail Modal that links to a dynamic Amazon search for the currently displayed Magic: The Gathering card, using the site's Amazon affiliate tag.

This will allow users to easily search for card-related products while generating affiliate revenue.

---

## 🔗 Amazon Affiliate Link Format

Use this format to generate the search URL:

```
https://www.amazon.com/s?k=[SEARCH_TERM]&tag=aidecktutor-20
```

Example:
```
https://www.amazon.com/s?k=Rhystic+Study+MTG&tag=aidecktutor-20
```

---

## ⚙️ Implementation Steps

### 1. Add Utility Function

Create a helper function to generate the Amazon search link based on the card name:

```javascript
const getAmazonAffiliateLink = (cardName) => {
  const searchTerm = encodeURIComponent(\`\${cardName} MTG\`);
  return \`https://www.amazon.com/s?k=\${searchTerm}&tag=aidecktutor-20\`;
};
```

---

### 2. Modify Card Detail Modal

In the component that renders the Card Detail Modal (where other external buttons like Scryfall or EDHREC are located), add the following:

```jsx
<a
  href={getAmazonAffiliateLink(cardData.name)}
  target="_blank"
  rel="noopener noreferrer"
  className="btn btn-amazon"
>
  Search on Amazon
</a>
```

Make sure `cardData.name` is the correct variable for the current card’s name (same as used for existing external links).

---

### 3. Optional Styling

Add a CSS class to match the look and feel of the other buttons:

```css
.btn-amazon {
  background-color: #FF9900;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  margin: 4px 0;
}

.btn-amazon:hover {
  background-color: #e88a00;
}
```

---

## ✅ Completion Checklist

- [ ] Amazon button appears inside the Card Detail Modal
- [ ] Button opens a new tab with a dynamic Amazon search using the current card name
- [ ] Affiliate tag `aidecktutor-20` is correctly included in the URL
- [ ] Styling matches existing external buttons
- [ ] Button only appears when `cardData.name` is valid

---

## 📌 Notes

- The button should be grouped with other card resource links (EDHREC, Scryfall, etc.)
- Avoid hardcoding specific card product links — always use the search format for flexibility
- Ensure `rel="noopener noreferrer"` is present for security best practices

---
