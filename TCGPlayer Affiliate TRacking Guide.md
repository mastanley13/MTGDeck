
If you only need a single link, such as a branded link for your social media accounts, here's how to create it:

When logged into Impact and viewing your dashboard, look on the right hand side of the screen for the “Create a Link” controls.
From the dropdown menu, choose TCGplayer as the brand.
(Optional) If you want to direct to a specific game or product, enter the TCGplayer URL for it in the “Enter a Landing Page” text box. Otherwise, the links will direct to TCGplayer’s homepage.
(Optional) If you'd like to track which piece of content your traffic is coming from, click the "Advanced" button and add values in the Sub ID section. 
(Optional) If you want to create a branded vanity link, for example, the name of your YouTube or Twitch channel, you can edit the link text by clicking the pencil icon and entering the name of your choice. 
Click the “Create” button.
Copy and paste the generated link as needed.

Alternatively, if you have numerous links that direct to specific products or decklists, this will act as a general formula for creating those links programmatically:

Generate a new TCGplayer link using the previous steps, or  if you're using TCGplayer’s API, click on "Content" from your top navbar, then "Assets". Make sure TCGplayer is selected as a brand, then click on the ad labeled "API Link". That will give you a link in the following format with your Impact partner ID in place of the Xs https://tcgplayer.pxf.io/c/xxxxxxx/1830156/21018
Whichever link you use, you'll then add the "?u=" parameter to the end of it, example: https://tcgplayer.pxf.io/c/xxxxxxx/1830156/21018?u=
To direct to a specific product or decklist, add the full, {encoded URL} of the TCGplayer page you want to link to. For example, the encoded URL to Magic the Gathering looks like this: https%3A%2F%2Ftcgplayer.com%2Fsearch%2Fmagic%2Fproduct.html
Add the encoded TCGplayer URL to the Impact URL: https://tcgplayer.pxf.io/c/xxxxxxx/1830156/21018?u=https%3A%2F%2Ftcgplayer.com%2Fsearch%2Fmagic%2Fproduct.html
When clicked through, the link will then generate a unique click ID and be credited to your Impact partner ID (Note: the example link isn't functional because there is no partner ID included in it).

Single Product Affiliate Link

When creating an Affiliate Link to use on Social Media, Twitch, or Youtube for a single product, the simplest method is to use Impact’s link generation tool:
When logged into Impact and viewing your dashboard, look on the right hand side of the screen for the “Create a Link” controls.
From the dropdown menu, choose TCGplayer as the brand.
(Optional) If you want to direct to a specific game or product, enter the TCGplayer URL for it in the “Enter a Landing Page” text box. Otherwise, the links will direct to TCGplayer’s homepage.
(Optional) If you'd like to track which piece of content your traffic is coming from, click the "Advanced" button and add values in the Sub ID section. 
(Optional) If you want to create a branded vanity link, for example, the name of your YouTube or Twitch channel, you can edit the link text by clicking the pencil icon and entering the name of your choice. 
Click the “Create” button.
Copy and paste the generated link as needed.
Mass Entry
One of the most convenient features offered by TCGplayer.com is the ability to use the Mass Entry tool to purchase a list of multiple cards at the same time and optimize around the best price points and conditions for the products. As an affiliate of TCGplayer, linking to Mass Entry with a deck list or other type of list of cards can be an excellent way to refer traffic and make it more convenient for users to purchase an entire deck list at the same time.
The quickest way to manually create a single Mass Entry tracking link is:
Go to the Mass Entry page on TCGplayer.com: ​​https://www.tcgplayer.com/massentry
Enter the cards you wish to add in the Mass Entry tool
Click the “Create Shareable Link” button below the Mass Entry tool
Copy the created link
Log-in to your Impact account
Paste the Mass Entry link as the landing page in Impact’s link generation tool
The Mass Entry tool can also be linked to through either a GET request or a POST request. 
GET Request
To do a GET request, you will need to begin with a link to a URL that includes a list of products. An example URL would look like this:
http://store.tcgplayer.com/massentry?productline=Magic&c=1%20Nissa,%20Steward%20of%20Elements||4%20Chart%20a%20Course||
You can also replace 'productline=Magic' with one of the other product lines currently supported by Mass Entry:
productline=Magic
productline=Yugioh
productline=Cardfight%20Vanguard

The list of cards for parameter c is a list of cards separated by these characters: ||
In the above URL, spaces have been replaced by the URL encoded character for space. (%20)
To convert it to an Impact tracking link, you can either use Impact’s link creation tool as outlined above, setting the Mass Entry link as the destination URL, or if you have numerous Mass Entry links, you can create them programmatically using this format:
Generate a new link to TCGplayer’s homepage using the link generation tool, or  if you're using TCGplayer’s API, click on "Content" from your top navbar, then "Assets". Make sure TCGplayer is selected as a brand, then click on the ad labeled "API Link". That will give you a link in the following format with your Impact partner ID in place of the Xs https://tcgplayer.pxf.io/c/xxxxxxx/1830156/21018
Whichever link you use, you'll then add the "?u=" parameter to the end of it, example: https://tcgplayer.pxf.io/c/xxxxxxx/1830156/21018?u=
To direct to a specific product or decklist, add the full, {encoded URL} of the TCGplayer page you want to link to. For example, the encoded URL to Magic the Gathering looks like this: http%3A%2F%2Fstore.tcgplayer.com%2Fmassentry%3Fproductline%3DMagic%26c%3D1%2520Nissa%2C%2520Steward%2520of%2520Elements%7C%7C4%2520Chart%2520a%2520Course%7C%7C
Add the encoded TCGplayer URL to the Impact URL: https://tcgplayer.pxf.io/c/xxxxxxx/1830156/21018?u=http%3A%2F%2Fstore.tcgplayer.com%2Fmassentry%3Fproductline%3DMagic%26c%3D1%2520Nissa%2C%2520Steward%2520of%2520Elements%7C%7C4%2520Chart%2520a%2520Course%7C%7C
When clicked through, the link will then generate a unique click ID and be credited to your Impact partner ID (Note: the example link isn't functional because there is no partner ID included in it).
POST Commands
Populating Mass Entry lists using POST commands is currently not compatible with Impact’s tracking on its own. However, we’ve created a piece of javascript that will populate Mass Entry lists while being linked to Impact’s tracking:

<!DOCTYPE html>
<html>
  <body>
    <form method="post" action="https://api.tcgplayer.com/massentry">
      <input type="text" name="c" value="1 counterspell||2 blood crypt">
      <input type="text" name="affiliateurl" value="https://tcgplayer.pfx.io">
      <input type="submit" value="Buy on TCGplayer">
    </form>
  </body>
</html>

To utilize the javascript, first enter the decklist as the value for the “c” parameter, then enter an Impact tracking URl that is linked to your account as the value for the “affiliateurl” parameter. 

Using bit.ly to build streaming friendly links

As Mass Entry links tend to be lengthy, we recommend using bit.ly to convert them to a form which will be easier to post in stream or within your video descriptions. Head on over to Bit.ly and paste the full link into the bar. From here, you should have a link generated that looks like this:

http://bit.ly/2AsSmqO

Bit.ly can be a great tool for tracking how many users are using different types of links. These links can easily be included in the description for a Youtube video or a Twitch stream and can be a great way to add value for your users and receive credit for the referrals that you make through our affiliate program.

