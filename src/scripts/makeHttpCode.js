// This is the code to use in Make.com's HTTP request "Body" section
// Make sure to select "Custom" in the mapping section

/*
Copy everything BELOW this line into Make.com's HTTP request "Body" section
when "Custom" is selected:
----------------------------------------
*/

// Test version that matches GoHighLevel custom fields
const testLocalVersion = () => {
    try {
        // Helper functions
        const ensureString = (value) => {
            if (!value) return "";
            return String(value);
        };

        // Test data matching GHL custom fields
        const testData = {
            contact: {
                title: "Test MTG Blog Post",
                content: "This is the main content of the blog post...",
                category: "Commander",
                featured_image: "https://example.com/image.jpg",
                excerpt: "A short excerpt of the blog post...",
                blog_tags: "mtg, commander, deck guide",
                date_published: new Date().toISOString(),
                author_name: "John Doe",
                author_id: "12345",
                author_avatar: "https://example.com/avatar.jpg",
                slug: "test-mtg-blog-post",
                read_time: "5 min"
            }
        };

        // Format the data to match your GHL structure
        const blogPost = {
            title: ensureString(testData.contact.title),
            content: ensureString(testData.contact.content),
            category: ensureString(testData.contact.category),
            featured_image: ensureString(testData.contact.featured_image),
            excerpt: ensureString(testData.contact.excerpt),
            blog_tags: ensureString(testData.contact.blog_tags),
            date_published: ensureString(testData.contact.date_published),
            author_name: ensureString(testData.contact.author_name),
            author_id: ensureString(testData.contact.author_id),
            author_avatar: ensureString(testData.contact.author_avatar),
            slug: ensureString(testData.contact.slug),
            read_time: ensureString(testData.contact.read_time)
        };

        return blogPost; // Return as object, not string
    } catch (error) {
        return {
            error: true,
            message: "Error processing blog post data"
        };
    }
};

// Test the code
console.log('\nTest Output:');
console.log(testLocalVersion());

/*
GOHIGHLEVEL VERSION - Copy everything between the lines below
----------------------------------------

try {
    const ensureString = (value) => {
        if (!value) return "";
        return String(value);
    };

    const blogPost = {
        title: ensureString(contact.title),
        content: ensureString(contact.content),
        category: ensureString(contact.category),
        featured_image: ensureString(contact.featured_image),
        excerpt: ensureString(contact.excerpt),
        blog_tags: ensureString(contact.blog_tags),
        date_published: ensureString(contact.date_published),
        author_name: ensureString(contact.author_name),
        author_id: ensureString(contact.author_id),
        author_avatar: ensureString(contact.author_avatar),
        slug: ensureString(contact.slug),
        read_time: ensureString(contact.read_time)
    };

    return blogPost;
} catch (error) {
    return {
        error: true,
        message: "Error processing blog post data"
    };
}

----------------------------------------
*/

/*
Copy everything BELOW this line into Make.com's HTTP request "Body" section
when "Custom" is selected:
----------------------------------------

const postData = {
    title: {{post.title}},
    content: {{post.content}},
    status: {{post.status}}
};
return JSON.stringify(postData);

----------------------------------------
*/ 