# XBS PUDO Selector

A Node.js/Express server for integrating PUDO (Pick Up Drop Off) location selection with Shopify stores, using the XBS Spring API for InPost shipping services in France and Poland.

## Overview

This application provides a complete solution for managing PUDO pickup points for e-commerce orders. It includes:

- **Customer Interface**: Self-service PUDO location selection page
- **Operator Dashboard**: Staff interface for selecting PUDO points on behalf of customers
- **Shopify Integration**: Checkout block extension for seamless order processing
- **XBS Spring API Integration**: Real-time PUDO location lookup and shipment creation

## Features

- 🌍 Multi-country support (France 🇫🇷 and Poland 🇵🇱)
- 🗺️ Interactive PUDO location search by postal code and city
- 📦 Automatic shipment creation with tracking numbers
- 🔄 Real-time Shopify order data integration
- 🎨 Multi-language interface (French and Polish)
- 🎯 Carrier-specific filtering (Colis Privé for France, InPost for Poland)
- 📱 Responsive design for mobile and desktop

## Architecture

```
xbs_vercel/
├── server.js              # Main Express server
├── package.json           # Node.js dependencies
├── Dockerfile            # Docker configuration for deployment
├── fly.toml              # Fly.io deployment configuration
├── shopify.app.toml      # Shopify app configuration
└── extensions/           # Shopify extensions
    ├── pudo-block/       # Checkout block extension
    └── pudo-selector/    # PUDO selector extension
```

## Prerequisites

- Node.js 20.18.0 or higher
- npm or yarn
- Shopify store with admin API access
- XBS Spring API credentials
- Fly.io account (for deployment)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# XBS Spring API
XBS_APIKEY=your_xbs_api_key_here

# Shopify API
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token_here

# Server Configuration
PORT=3000
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd xbs_vercel
```

2. Install dependencies:
```bash
npm install
```

3. Create and configure your `.env` file with the required credentials

4. Start the development server:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Core Endpoints

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

#### `GET /apps/xbs-pudo`
Get PUDO locations for a specific country and postal code.

**Query Parameters:**
- `country` (required): ISO country code (FR, PL)
- `zip` (required): Postal code
- `city` (optional): City name (required for Italy)

**Example:**
```bash
GET /apps/xbs-pudo?country=FR&zip=75001
```

**Response:**
```json
{
  "success": true,
  "country": "FR",
  "totalFound": 50,
  "filtered": 25,
  "locations": [
    {
      "id": "H4045",
      "name": "Relay Point Example",
      "address1": "123 Main Street",
      "address2": "",
      "city": "Paris",
      "zip": "75001",
      "country": "FR",
      "carrier": "Colis Prive",
      "service": "CLLCT",
      "latitude": "48.8566",
      "longitude": "2.3522",
      "businessHours": "Mon-Sat 9:00-19:00"
    }
  ]
}
```

#### `POST /apps/xbs-shipment`
Create a shipment with PUDO location.

**Request Body:**
```json
{
  "shipperReference": "ORDER-12345",
  "weight": 1.5,
  "value": 50.00,
  "currency": "EUR",
  "pudoLocationId": "H4045",
  "consignorAddress": {
    "Name": "Your Store",
    "Company": "Your Company",
    "Address1": "Store Address",
    "City": "City",
    "Zip": "12345",
    "CountryCode": "ES",
    "Mobile": "+34123456789",
    "Email": "store@example.com"
  },
  "consigneeAddress": {
    "Name": "Customer Name",
    "Address1": "Customer Address",
    "City": "City",
    "Zip": "75001",
    "CountryCode": "FR",
    "Mobile": "+33123456789",
    "Email": "customer@example.com"
  },
  "products": [
    {
      "Description": "Product Name",
      "Sku": "SKU123",
      "HsCode": "3304990000",
      "Quantity": 1,
      "Value": 50.00
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "trackingNumber": "TRACK123456789",
  "shipperReference": "ORDER-12345",
  "carrier": "Colis Prive",
  "labelImage": "base64_encoded_label",
  "labelFormat": "ZPL200"
}
```

#### `POST /apps/complete-inpost-order`
Complete an InPost order by assigning a PUDO location and creating a shipment.

**Request Body:**
```json
{
  "orderNumber": "1001",
  "pudoLocationId": "H4045",
  "country": "FR"
}
```

**Response:**
```json
{
  "success": true,
  "trackingNumber": "TRACK123456789",
  "carrier": "Colis Prive",
  "country": "FR",
  "pudoLocationId": "H4045",
  "message": "Order successfully sent to InPost/Spring with PUDO location"
}
```

### Utility Endpoints

#### `GET /apps/xbs-services`
Get available shipping services for your XBS account.

#### `GET /apps/xbs-track/:trackingNumber`
Track a shipment by tracking number.

#### `GET /apps/test-pudo-shipment`
Test endpoint for PUDO shipment creation (development/testing only).

#### `GET /apps/test-simple-shipment`
Test endpoint for simple shipment without PUDO (development/testing only).

### User Interfaces

#### `GET /pudo-selection`
Customer-facing PUDO location selection page.

**Query Parameters:**
- `orderNumber`: Shopify order number
- `country`: Country code (FR or PL)

**Example:**
```
https://your-domain.com/pudo-selection?orderNumber=1001&country=FR
```

#### `GET /operator-pudo`
Operator dashboard for selecting PUDO locations on behalf of customers.

**Example:**
```
https://your-domain.com/operator-pudo
```

Can also pre-fill order number:
```
https://your-domain.com/operator-pudo?id=1001
```

## Deployment

### Deploy to Fly.io

1. Install Fly.io CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Login to Fly.io:
```bash
fly auth login
```

3. Deploy the application:
```bash
fly deploy
```

4. Set environment variables:
```bash
fly secrets set XBS_APIKEY=your_api_key_here
fly secrets set SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
fly secrets set SHOPIFY_ACCESS_TOKEN=your_token_here
```

The application will be deployed at `https://xbs-yje6tg.fly.dev/`

### Docker Deployment

Build the Docker image:
```bash
docker build -t xbs-pudo-server .
```

Run the container:
```bash
docker run -p 3000:3000 \
  -e XBS_APIKEY=your_api_key \
  -e SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com \
  -e SHOPIFY_ACCESS_TOKEN=your_token \
  xbs-pudo-server
```

## Shopify Integration

### Checkout Extension

The project includes a Shopify checkout block extension located in `extensions/pudo-block/`.

To deploy the extension:

1. Install Shopify CLI:
```bash
npm install -g @shopify/cli
```

2. Deploy the extension:
```bash
shopify app deploy
```

3. Configure the extension in your Shopify admin panel under Checkout settings.

## Configuration

### Consignor Address (Sender)

Update the default sender address in [server.js:521-534](server.js#L521-L534):

```javascript
consignorAddress: {
  Name: "Your Store Name",
  Company: "Your Company Name",
  Address1: "Your Street Address",
  City: "Your City",
  State: "Your State",
  Zip: "Your Postal Code",
  CountryCode: "ES", // Your country code
  Mobile: "Your Phone Number",
  Email: "your-email@example.com",
  Vat: "Your VAT Number",
  Eori: "Your EORI Number",
}
```

### Supported Carriers

- **France**: Colis Privé (filtered automatically)
- **Poland**: InPost (filtered automatically)

Carrier filtering is configured in [server.js:408-420](server.js#L408-L420).

## Development

### Project Structure

- **server.js**: Main application server with all endpoints and business logic
- **extensions/pudo-block/**: Shopify checkout block extension
- **extensions/pudo-selector/**: Additional PUDO selector extension

### Key Functions

- `createXBSShipment()`: Creates shipments via XBS API
- `getShopifyOrder()`: Fetches order data from Shopify
- `calculateWeight()`: Calculates total weight from line items
- `isInPostOrder()`: Checks if order uses InPost shipping
- `getInPostCountry()`: Determines country from shipping method

## Troubleshooting

### Common Issues

**PUDO locations not appearing:**
- Verify XBS API key is correct
- Check that the postal code format matches country standards
- Ensure carrier filtering is appropriate for your region

**Shipment creation fails:**
- Verify all required fields are present (pudoLocationId, weight, products)
- Check that the service is set to "CLLCT" for PUDO orders
- Ensure consignor address has valid VAT and EORI numbers

**Shopify order not found:**
- Verify Shopify API credentials
- Check that the order number format matches (with or without #)
- Ensure the order exists and is not archived

## Support

For XBS Spring API issues, contact Spring GDS support.

For Shopify integration issues, refer to [Shopify Developer Documentation](https://shopify.dev/docs).

## License

ISC

## Author

Spring GDS Integration Team
