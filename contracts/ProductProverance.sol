// contracts/ProductProvenance.sol
pragma solidity ^0.8.19;

contract ProductProvenance {
    struct Product {
        string serialNumber;
        string metadata; // JSON string with product details
        string[] assetImageCIDs; // Array of IPFS CIDs for images
        string invoiceCID; // IPFS CID for invoice PDF
        address manufacturer;
        uint256 timestamp;
        bool isActive;
    }

    mapping(string => Product) public products;
    mapping(string => bool) public serialExists;

    event ProductRegistered(
        string indexed serialNumber,
        address indexed manufacturer,
        string[] assetImageCIDs,
        string invoiceCID,
        uint256 timestamp
    );

    function registerProduct(
        string memory _serialNumber,
        string memory _metadata,
        string[] memory _assetImageCIDs,
        string memory _invoiceCID
    ) external {
        require(!serialExists[_serialNumber], "Product already exists");
        require(bytes(_serialNumber).length > 0, "Serial number required");
        require(_assetImageCIDs.length > 0 || bytes(_invoiceCID).length > 0, "At least one file required");

        products[_serialNumber] = Product({
            serialNumber: _serialNumber,
            metadata: _metadata,
            assetImageCIDs: _assetImageCIDs,
            invoiceCID: _invoiceCID,
            manufacturer: msg.sender,
            timestamp: block.timestamp,
            isActive: true
        });

        serialExists[_serialNumber] = true;

        emit ProductRegistered(
            _serialNumber,
            msg.sender,
            _assetImageCIDs,
            _invoiceCID,
            block.timestamp
        );
    }

    function getProduct(string memory _serialNumber) 
        external 
        view 
        returns (Product memory) 
    {
        require(serialExists[_serialNumber], "Product not found");
        return products[_serialNumber];
    }

    function verifyProduct(string memory _serialNumber) 
        external 
        view 
        returns (bool exists, address manufacturer, uint256 timestamp) 
    {
        if (serialExists[_serialNumber]) {
            Product memory product = products[_serialNumber];
            return (true, product.manufacturer, product.timestamp);
        }
        return (false, address(0), 0);
    }

    function getProductFiles(string memory _serialNumber)
        external
        view
        returns (string[] memory assetImageCIDs, string memory invoiceCID)
    {
        require(serialExists[_serialNumber], "Product not found");
        Product memory product = products[_serialNumber];
        return (product.assetImageCIDs, product.invoiceCID);
    }
}