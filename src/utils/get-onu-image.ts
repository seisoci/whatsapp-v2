/**
 * Convert ONU image URL from remote/backend to local static assets
 * @param imageUrl - The image URL from backend (e.g., http://localhost:8001/storage/image/onu_type/690c1b2a4076c.png or https://itn.smartolt.com/content/img/4_eth_0_voip_1_catv.png)
 * @returns Local static asset path
 */
export function getOnuImage(imageUrl: string): string {
  if (!imageUrl) {
    return '/images/onu-types/default.png';
  }

  // Extract filename from URL
  const urlParts = imageUrl.split('/');
  const filename = urlParts[urlParts.length - 1];

  // Map known remote images to local assets
  const imageMapping: Record<string, string> = {
    '4_eth_0_voip_1_catv.png': '/images/onu-types/4_eth_0_voip_1_catv.png',
    // Add more mappings as needed
  };

  // Check if we have a mapping for this filename
  if (imageMapping[filename]) {
    return imageMapping[filename];
  }

  // Check if it's from smartolt.com remote server
  if (imageUrl.includes('itn.smartolt.com/content/img/')) {
    const smartoltFilename = imageUrl.split('itn.smartolt.com/content/img/')[1];
    if (imageMapping[smartoltFilename]) {
      return imageMapping[smartoltFilename];
    }
  }

  // Check if it's from localhost backend storage
  if (imageUrl.includes('localhost:8001/storage/image/onu_type/')) {
    // For backend images, we'll use the 4_eth_0_voip_1_catv.png as default for now
    // You can extend the mapping based on ONU type or other criteria
    return '/images/onu-types/4_eth_0_voip_1_catv.png';
  }

  // Default fallback
  return '/images/onu-types/4_eth_0_voip_1_catv.png';
}
