// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ProductRegistry {
    struct Product {
        uint256 productId;
        address initialOwner;
        address currentOwner;
        uint256 registrationTimestamp;
        string metadataHash;
        bool isRegistered;
    }
    
    struct Invoice {
        uint256 invoiceId;
        uint256 productId;
        address seller;
        address buyer;
        string invoiceHash;
        string lighthouseURI;
        uint256 timestamp;
        bool isTransferComplete;
    }
    
    struct TransferCertificate {
        uint256 certificateId;
        uint256 productId;
        uint256 invoiceId;
        address seller;
        address buyer;
        string certificateHash;
        string lighthouseURI;
        bool sellerSigned;
        bool buyerSigned;
        uint256 timestamp;
        bool isComplete;
    }
    
    // State variables
    mapping(uint256 => Product) public products;
    mapping(uint256 => Invoice[]) public productInvoices;
    mapping(uint256 => TransferCertificate[]) public productTransfers;
    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => TransferCertificate) public transferCertificates;
    
    uint256 public nextProductId = 1;
    uint256 public nextInvoiceId = 1;
    uint256 public nextCertificateId = 1;
    
    // Events
    event ProductRegistered(uint256 indexed productId, address indexed owner, string metadataHash);
    event InvoiceCreated(uint256 indexed invoiceId, uint256 indexed productId, address indexed seller, address buyer);
    event TransferInitiated(uint256 indexed certificateId, uint256 indexed productId, address indexed seller, address buyer);
    event TransferSigned(uint256 indexed certificateId, address indexed signer, bool isComplete);
    event OwnershipTransferred(uint256 indexed productId, address indexed from, address indexed to);
    
    // Modifiers
    modifier onlyProductOwner(uint256 productId) {
        require(products[productId].currentOwner == msg.sender, "Not the product owner");
        _;
    }
    
    modifier productExists(uint256 productId) {
        require(products[productId].isRegistered, "Product does not exist");
        _;
    }
    
    // Functions
    
    /**
     * @dev Register a new product
     * @param metadataHash IPFS hash of product metadata
     * @return productId The ID of the newly registered product
     */
    function registerProduct(string memory metadataHash) external returns (uint256) {
        uint256 productId = nextProductId++;
        
        products[productId] = Product({
            productId: productId,
            initialOwner: msg.sender,
            currentOwner: msg.sender,
            registrationTimestamp: block.timestamp,
            metadataHash: metadataHash,
            isRegistered: true
        });
        
        emit ProductRegistered(productId, msg.sender, metadataHash);
        return productId;
    }
    
    /**
     * @dev Create an invoice for a product sale
     * @param productId The product being sold
     * @param buyer Address of the buyer
     * @param invoiceHash Hash of the invoice JSON
     * @param lighthouseURI Lighthouse storage URI for the invoice PDF
     * @return invoiceId The ID of the created invoice
     */
    function createInvoice(
        uint256 productId,
        address buyer,
        string memory invoiceHash,
        string memory lighthouseURI
    ) external productExists(productId) onlyProductOwner(productId) returns (uint256) {
        require(buyer != address(0), "Invalid buyer address");
        require(buyer != msg.sender, "Cannot sell to yourself");
        
        uint256 invoiceId = nextInvoiceId++;
        
        Invoice memory newInvoice = Invoice({
            invoiceId: invoiceId,
            productId: productId,
            seller: msg.sender,
            buyer: buyer,
            invoiceHash: invoiceHash,
            lighthouseURI: lighthouseURI,
            timestamp: block.timestamp,
            isTransferComplete: false
        });
        
        invoices[invoiceId] = newInvoice;
        productInvoices[productId].push(newInvoice);
        
        emit InvoiceCreated(invoiceId, productId, msg.sender, buyer);
        return invoiceId;
    }
    
    /**
     * @dev Initiate a transfer certificate (seller starts the process)
     * @param invoiceId The invoice ID associated with this transfer
     * @param certificateHash Hash of the transfer certificate JSON
     * @param lighthouseURI Lighthouse storage URI for the certificate PDF
     * @return certificateId The ID of the created transfer certificate
     */
    function initiateTransfer(
        uint256 invoiceId,
        string memory certificateHash,
        string memory lighthouseURI
    ) external returns (uint256) {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.seller == msg.sender, "Only seller can initiate transfer");
        require(!invoice.isTransferComplete, "Transfer already completed");
        
        uint256 certificateId = nextCertificateId++;
        
        TransferCertificate memory newCertificate = TransferCertificate({
            certificateId: certificateId,
            productId: invoice.productId,
            invoiceId: invoiceId,
            seller: invoice.seller,
            buyer: invoice.buyer,
            certificateHash: certificateHash,
            lighthouseURI: lighthouseURI,
            sellerSigned: true, // Seller signs when initiating
            buyerSigned: false,
            timestamp: block.timestamp,
            isComplete: false
        });
        
        transferCertificates[certificateId] = newCertificate;
        productTransfers[invoice.productId].push(newCertificate);
        
        emit TransferInitiated(certificateId, invoice.productId, invoice.seller, invoice.buyer);
        emit TransferSigned(certificateId, msg.sender, false);
        
        return certificateId;
    }
    
    /**
     * @dev Sign a transfer certificate (buyer completes the transfer)
     * @param certificateId The transfer certificate to sign
     */
    function signTransfer(uint256 certificateId) external {
        TransferCertificate storage certificate = transferCertificates[certificateId];
        require(!certificate.isComplete, "Transfer already completed");
        
        if (msg.sender == certificate.seller) {
            require(!certificate.sellerSigned, "Seller already signed");
            certificate.sellerSigned = true;
        } else if (msg.sender == certificate.buyer) {
            require(!certificate.buyerSigned, "Buyer already signed");
            certificate.buyerSigned = true;
        } else {
            revert("Not authorized to sign this transfer");
        }
        
        // Check if both parties have signed
        bool isComplete = certificate.sellerSigned && certificate.buyerSigned;
        certificate.isComplete = isComplete;
        
        if (isComplete) {
            // Transfer ownership
            Product storage product = products[certificate.productId];
            address previousOwner = product.currentOwner;
            product.currentOwner = certificate.buyer;
            
            // Mark invoice as complete
            invoices[certificate.invoiceId].isTransferComplete = true;
            
            emit OwnershipTransferred(certificate.productId, previousOwner, certificate.buyer);
        }
        
        emit TransferSigned(certificateId, msg.sender, isComplete);
    }
    
    /**
     * @dev Get product audit trail (invoices and transfers)
     * @param productId The product to get audit trail for
     * @return invoiceCount Number of invoices
     * @return transferCount Number of transfers
     */
    function getProductAuditTrail(uint256 productId) external view productExists(productId) 
        returns (uint256 invoiceCount, uint256 transferCount) {
        return (productInvoices[productId].length, productTransfers[productId].length);
    }
    
    /**
     * @dev Get product invoices
     * @param productId The product ID
     * @return Array of invoices for the product
     */
    function getProductInvoices(uint256 productId) external view productExists(productId) 
        returns (Invoice[] memory) {
        return productInvoices[productId];
    }
    
    /**
     * @dev Get product transfers
     * @param productId The product ID  
     * @return Array of transfer certificates for the product
     */
    function getProductTransfers(uint256 productId) external view productExists(productId) 
        returns (TransferCertificate[] memory) {
        return productTransfers[productId];
    }
    
    /**
     * @dev Get product details
     * @param productId The product ID
     * @return Product struct
     */
    function getProduct(uint256 productId) external view productExists(productId) 
        returns (Product memory) {
        return products[productId];
    }
    
    /**
     * @dev Get invoice details
     * @param invoiceId The invoice ID
     * @return Invoice struct
     */
    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }
    
    /**
     * @dev Get transfer certificate details
     * @param certificateId The certificate ID
     * @return TransferCertificate struct
     */
    function getTransferCertificate(uint256 certificateId) external view returns (TransferCertificate memory) {
        return transferCertificates[certificateId];
    }
}