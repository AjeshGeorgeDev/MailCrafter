/**
 * Variable Definitions
 * Standard and custom variables available for email templates
 */

export interface VariableDefinition {
  name: string;
  path: string;
  description: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  sampleValue: any;
  category: "User" | "Company" | "Product" | "Order" | "Custom" | string;
}

/**
 * Standard variable definitions
 */
export const STANDARD_VARIABLES: VariableDefinition[] = [
  // User variables
  {
    name: "User Name",
    path: "user.name",
    description: "Full name of the user",
    type: "string",
    sampleValue: "John Doe",
    category: "User",
  },
  {
    name: "User Email",
    path: "user.email",
    description: "Email address of the user",
    type: "string",
    sampleValue: "john.doe@example.com",
    category: "User",
  },
  {
    name: "First Name",
    path: "user.firstName",
    description: "First name of the user",
    type: "string",
    sampleValue: "John",
    category: "User",
  },
  {
    name: "Last Name",
    path: "user.lastName",
    description: "Last name of the user",
    type: "string",
    sampleValue: "Doe",
    category: "User",
  },
  {
    name: "User ID",
    path: "user.id",
    description: "Unique identifier for the user",
    type: "string",
    sampleValue: "usr_123456",
    category: "User",
  },
  
  // Company variables
  {
    name: "Company Name",
    path: "company.name",
    description: "Name of the company",
    type: "string",
    sampleValue: "Acme Corporation",
    category: "Company",
  },
  {
    name: "Company Address",
    path: "company.address",
    description: "Full address of the company",
    type: "string",
    sampleValue: "123 Main St, City, State 12345",
    category: "Company",
  },
  {
    name: "Company Phone",
    path: "company.phone",
    description: "Phone number of the company",
    type: "string",
    sampleValue: "+1 (555) 123-4567",
    category: "Company",
  },
  {
    name: "Company Email",
    path: "company.email",
    description: "Contact email for the company",
    type: "string",
    sampleValue: "contact@acme.com",
    category: "Company",
  },
  {
    name: "Company Website",
    path: "company.website",
    description: "Website URL of the company",
    type: "string",
    sampleValue: "https://acme.com",
    category: "Company",
  },
  
  // Product variables
  {
    name: "Product Name",
    path: "product.name",
    description: "Name of the product",
    type: "string",
    sampleValue: "Premium Widget",
    category: "Product",
  },
  {
    name: "Product Price",
    path: "product.price",
    description: "Price of the product",
    type: "number",
    sampleValue: 99.99,
    category: "Product",
  },
  {
    name: "Product Image",
    path: "product.image",
    description: "URL of the product image",
    type: "string",
    sampleValue: "https://example.com/product.jpg",
    category: "Product",
  },
  {
    name: "Product Description",
    path: "product.description",
    description: "Description of the product",
    type: "string",
    sampleValue: "A high-quality widget for all your needs",
    category: "Product",
  },
  
  // Order variables
  {
    name: "Order Total",
    path: "order.total",
    description: "Total amount of the order",
    type: "number",
    sampleValue: 199.99,
    category: "Order",
  },
  {
    name: "Order Date",
    path: "order.date",
    description: "Date of the order",
    type: "string",
    sampleValue: "2024-01-15",
    category: "Order",
  },
  {
    name: "Order ID",
    path: "order.id",
    description: "Unique identifier for the order",
    type: "string",
    sampleValue: "ORD-123456",
    category: "Order",
  },
  {
    name: "Order Items",
    path: "order.items",
    description: "Array of order items",
    type: "array",
    sampleValue: [
      { name: "Product 1", quantity: 2, price: 50.00 },
      { name: "Product 2", quantity: 1, price: 99.99 },
    ],
    category: "Order",
  },
];

/**
 * Sample data for preview/testing
 */
export const SAMPLE_DATA: Record<string, any> = {
  user: {
    id: "usr_123456",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
  },
  company: {
    name: "Acme Corporation",
    address: "123 Main St, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "contact@acme.com",
    website: "https://acme.com",
  },
  product: {
    name: "Premium Widget",
    price: 99.99,
    image: "https://via.placeholder.com/300x200",
    description: "A high-quality widget for all your needs",
  },
  order: {
    id: "ORD-123456",
    date: "2024-01-15",
    total: 199.99,
    items: [
      { name: "Product 1", quantity: 2, price: 50.00 },
      { name: "Product 2", quantity: 1, price: 99.99 },
    ],
  },
};

/**
 * Get variables by category
 */
export function getVariablesByCategory(): Record<string, VariableDefinition[]> {
  const categories: Record<string, VariableDefinition[]> = {};
  
  STANDARD_VARIABLES.forEach(variable => {
    if (!categories[variable.category]) {
      categories[variable.category] = [];
    }
    categories[variable.category].push(variable);
  });
  
  return categories;
}

/**
 * Find variable definition by path
 */
export function findVariableDefinition(path: string): VariableDefinition | undefined {
  return STANDARD_VARIABLES.find(v => v.path === path);
}

/**
 * Get all variable paths
 */
export function getAllVariablePaths(): string[] {
  return STANDARD_VARIABLES.map(v => v.path);
}

/**
 * Validate variable path
 */
export function isValidVariablePath(path: string): boolean {
  return STANDARD_VARIABLES.some(v => v.path === path);
}

