import { render } from "preact";
import { useState } from "preact/hooks";

export default async () => {
  render(<PudoSelector />, document.body);
};

function PudoSelector() {
  const { data } = shopify;
  const orderId = data?.selected?.[0]?.id;
  const orderName = orderId ? orderId.split("/").pop() : "Unknown";

  const [country, setCountry] = useState("FR");
  const [postalCode, setPostalCode] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [shipmentCreated, setShipmentCreated] = useState(false);

  const API_BASE = "https://pudoselector.vercel.app"; // Replace with your Vercel URL

  async function searchLocations() {
    if (!postalCode) {
      setMessage({ type: "critical", text: "Please enter a postal code" });
      return;
    }

    setLoading(true);
    setMessage(null);
    setLocations([]);
    setSelectedLocation(null);

    try {
      const response = await fetch(
        `${API_BASE}/apps/xbs-pudo?country=${country}&zip=${encodeURIComponent(
          postalCode
        )}`
      );
      const result = await response.json();

      if (result.success && result.locations.length > 0) {
        setLocations(result.locations);
        setMessage({
          type: "success",
          text: `Found ${result.locations.length} locations`,
        });
      } else {
        setMessage({
          type: "warning",
          text: "No PUDO locations found. Try a different postal code.",
        });
      }
    } catch (error) {
      setMessage({
        type: "critical",
        text: "Error searching locations: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function createShipment() {
    if (!selectedLocation) {
      setMessage({ type: "critical", text: "Please select a location first" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/apps/complete-inpost-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderName,
          pudoLocationId: selectedLocation.id,
          country: country,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: `✓ Shipment created! Tracking: ${result.trackingNumber}`,
        });
        setShipmentCreated(true);
      } else {
        setMessage({ type: "critical", text: "Error: " + result.error });
      }
    } catch (error) {
      setMessage({
        type: "critical",
        text: "Connection error: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  if (shipmentCreated) {
    return (
      <s-admin-block heading="🚚 PUDO Selection">
        <s-stack direction="block" spacing="base">
          <s-banner tone="success">
            Shipment created successfully! The tracking number has been
            assigned.
          </s-banner>
        </s-stack>
      </s-admin-block>
    );
  }

  return (
    <s-admin-block heading="🚚 PUDO Selection">
      <s-stack direction="block" spacing="base">
        {/* Order Info */}
        <s-text>
          Order: <s-text type="strong">#{orderName}</s-text>
        </s-text>

        {/* Country Selector */}
        <s-select
          label="Country"
          value={country}
          onInput={(e) => setCountry(e.target.value)}
        >
          <option value="FR">🇫🇷 France</option>
          <option value="PL">🇵🇱 Poland</option>
        </s-select>

        {/* Postal Code Input */}
        <s-text-field
          label="Postal Code"
          value={postalCode}
          onInput={(e) => setPostalCode(e.target.value)}
          placeholder={country === "FR" ? "75001" : "00-001"}
        />

        {/* Search Button */}
        <s-button
          variant="primary"
          onClick={searchLocations}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search PUDO Locations"}
        </s-button>

        {/* Messages */}
        {message && <s-banner tone={message.type}>{message.text}</s-banner>}

        {/* Locations List */}
        {locations.length > 0 && (
          <s-stack direction="block" spacing="tight">
            <s-text type="strong">Select a pickup point:</s-text>
            {locations.slice(0, 10).map((loc) => (
              <s-box
                key={loc.id}
                padding="base"
                border={selectedLocation?.id === loc.id ? "base" : "none"}
                borderRadius="base"
                background={
                  selectedLocation?.id === loc.id
                    ? "success-fill-secondary"
                    : "default"
                }
                onClick={() => setSelectedLocation(loc)}
                style={{ cursor: "pointer" }}
              >
                <s-stack direction="block" spacing="tight">
                  <s-text type="strong">{loc.name}</s-text>
                  <s-text>{loc.address1}</s-text>
                  <s-text>
                    {loc.zip} {loc.city}
                  </s-text>
                  <s-badge>{loc.carrier}</s-badge>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}

        {/* Create Shipment Button */}
        {selectedLocation && (
          <s-button
            variant="primary"
            tone="success"
            onClick={createShipment}
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : `Create Shipment → ${selectedLocation.name}`}
          </s-button>
        )}
      </s-stack>
    </s-admin-block>
  );
}
