import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Upload, Mail } from "lucide-react";
import Link from "next/link";

export default function ContactsPage() {
  // Mock data
  const contacts = [
    {
      id: "1",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      status: "Subscribed",
      list: "Newsletter",
      subscribedAt: "2024-10-15",
    },
    {
      id: "2",
      email: "jane.smith@example.com",
      firstName: "Jane",
      lastName: "Smith",
      status: "Subscribed",
      list: "Newsletter",
      subscribedAt: "2024-10-20",
    },
    {
      id: "3",
      email: "bob.wilson@example.com",
      firstName: "Bob",
      lastName: "Wilson",
      status: "Unsubscribed",
      list: "Promotional",
      subscribedAt: "2024-09-10",
    },
  ];

  const lists = [
    { id: "1", name: "Newsletter", count: 1250 },
    { id: "2", name: "Promotional", count: 850 },
    { id: "3", name: "Customers", count: 2300 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contact lists and subscribers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {lists.map((list) => (
          <Card key={list.id}>
            <CardHeader>
              <CardTitle className="text-lg">{list.name}</CardTitle>
              <CardDescription>{list.count} contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View List
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Contacts</CardTitle>
              <CardDescription>
                Manage your contact database
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search contacts..."
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No contacts yet</p>
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Contact
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>List</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.email}</TableCell>
                    <TableCell>
                      {contact.firstName} {contact.lastName}
                    </TableCell>
                    <TableCell>{contact.list}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          contact.status === "Subscribed" ? "default" : "secondary"
                        }
                      >
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{contact.subscribedAt}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
