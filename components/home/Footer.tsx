import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MailCrafter
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              Professional email template builder and campaign management platform.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/features" className="hover:text-gray-900">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-gray-900">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/templates" className="hover:text-gray-900">
                  Templates
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-gray-900">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-gray-900">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gray-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/docs" className="hover:text-gray-900">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="hover:text-gray-900">
                  API
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-gray-900">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} MailCrafter. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

