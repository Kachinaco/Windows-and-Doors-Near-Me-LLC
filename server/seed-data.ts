import { storage } from "./storage";

export async function seedBoardData() {
  try {
    // Create sample board columns
    const columns = [
      { board_id: 1, name: "Item", type: "text", order: 1, width: 200 },
      { board_id: 1, name: "Status", type: "status", order: 2, width: 120 },
      { board_id: 1, name: "People", type: "people", order: 3, width: 150 },
      { board_id: 1, name: "Location", type: "text", order: 4, width: 180 },
      { board_id: 1, name: "Phone", type: "phone", order: 5, width: 140 },
      { board_id: 1, name: "Due Date", type: "date", order: 6, width: 120 }
    ];

    const createdColumns = [];
    for (const column of columns) {
      const created = await storage.createBoardColumn(column);
      createdColumns.push(created);
    }

    // Create sample board items with different groups
    const items = [
      {
        board_id: 1,
        admin_id: 1,
        group_name: "New Leads",
        order: 1
      },
      {
        board_id: 1,
        admin_id: 1,
        group_name: "New Leads", 
        order: 2
      },
      {
        board_id: 1,
        admin_id: 1,
        group_name: "Active Projects",
        order: 3
      },
      {
        board_id: 1,
        admin_id: 1,
        group_name: "Active Projects",
        order: 4
      },
      {
        board_id: 1,
        admin_id: 1,
        group_name: "Scheduled Work",
        order: 5
      }
    ];

    const createdItems = [];
    for (const item of items) {
      const created = await storage.createBoardItem(item);
      createdItems.push(created);
    }

    // Create sample values for the items
    const itemValues = [
      // First item - Kitchen Renovation
      { item_id: createdItems[0].id, column_id: createdColumns[0].id, value: "Kitchen Renovation" },
      { item_id: createdItems[0].id, column_id: createdColumns[1].id, value: "in progress" },
      { item_id: createdItems[0].id, column_id: createdColumns[2].id, value: "John Smith" },
      { item_id: createdItems[0].id, column_id: createdColumns[3].id, value: "123 Main St, Gilbert" },
      { item_id: createdItems[0].id, column_id: createdColumns[4].id, value: "(555) 123-4567" },
      { item_id: createdItems[0].id, column_id: createdColumns[5].id, value: "2025-07-15" },

      // Second item - Bathroom Remodel  
      { item_id: createdItems[1].id, column_id: createdColumns[0].id, value: "Bathroom Remodel" },
      { item_id: createdItems[1].id, column_id: createdColumns[1].id, value: "not started" },
      { item_id: createdItems[1].id, column_id: createdColumns[2].id, value: "Sarah Wilson" },
      { item_id: createdItems[1].id, column_id: createdColumns[3].id, value: "456 Oak Ave, Mesa" },
      { item_id: createdItems[1].id, column_id: createdColumns[4].id, value: "(555) 234-5678" },
      { item_id: createdItems[1].id, column_id: createdColumns[5].id, value: "2025-08-01" },

      // Third item - Living Room Windows
      { item_id: createdItems[2].id, column_id: createdColumns[0].id, value: "Living Room Windows" },
      { item_id: createdItems[2].id, column_id: createdColumns[1].id, value: "complete" },
      { item_id: createdItems[2].id, column_id: createdColumns[2].id, value: "Mike Johnson" },
      { item_id: createdItems[2].id, column_id: createdColumns[3].id, value: "789 Pine St, Chandler" },
      { item_id: createdItems[2].id, column_id: createdColumns[4].id, value: "(555) 345-6789" },
      { item_id: createdItems[2].id, column_id: createdColumns[5].id, value: "2025-07-10" },

      // Fourth item - Front Door Installation
      { item_id: createdItems[3].id, column_id: createdColumns[0].id, value: "Front Door Installation" },
      { item_id: createdItems[3].id, column_id: createdColumns[1].id, value: "in progress" },
      { item_id: createdItems[3].id, column_id: createdColumns[2].id, value: "Lisa Chen" },
      { item_id: createdItems[3].id, column_id: createdColumns[3].id, value: "321 Elm Dr, Tempe" },
      { item_id: createdItems[3].id, column_id: createdColumns[4].id, value: "(555) 456-7890" },
      { item_id: createdItems[3].id, column_id: createdColumns[5].id, value: "2025-07-20" },

      // Fifth item - Patio Door Replacement
      { item_id: createdItems[4].id, column_id: createdColumns[0].id, value: "Patio Door Replacement" },
      { item_id: createdItems[4].id, column_id: createdColumns[1].id, value: "scheduled" },
      { item_id: createdItems[4].id, column_id: createdColumns[2].id, value: "David Martinez" },
      { item_id: createdItems[4].id, column_id: createdColumns[3].id, value: "654 Cedar Ln, Scottsdale" },
      { item_id: createdItems[4].id, column_id: createdColumns[4].id, value: "(555) 567-8901" },
      { item_id: createdItems[4].id, column_id: createdColumns[5].id, value: "2025-07-25" }
    ];

    // Insert all the values
    for (const value of itemValues) {
      await storage.setBoardItemValue(value);
    }

    console.log("✓ Sample board data seeded successfully");
    console.log(`✓ Created ${createdColumns.length} columns`);
    console.log(`✓ Created ${createdItems.length} items`);
    console.log(`✓ Created ${itemValues.length} item values`);

    return {
      columns: createdColumns,
      items: createdItems,
      values: itemValues
    };

  } catch (error) {
    console.error("Error seeding board data:", error);
    throw error;
  }
}