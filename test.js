const sharp = require('sharp');
const fs = require('fs').promises;

// Sample base64 PNG image (1x1 pixel red image)
async function createThumbnail(width) {
    try {
        // Convert base64 string to buffer
        const imageBuffer = await fs.readFile('test-image.png');
        const base64String = imageBuffer.toString('base64');

        const buffer = Buffer.from(base64String, 'base64');

        
        // Create thumbnail with only width resizing
        const thumbnailBuffer = await sharp(imageBuffer)
            .resize({ width: width })
            .toBuffer();
        
        // Convert buffer back to base64
        return thumbnailBuffer.toString('base64');
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        throw error;
    }
}

// Example usage
createThumbnail(100)
    .then(thumbnail => {
        console.log('Thumbnail base64:', thumbnail);
    })
    .catch(err => {
        console.error('Error:', err);
    });
