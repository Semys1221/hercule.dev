The "Reading Data" Story (When you open the CRM)


When you open your browser to look at your 5-column CRM board, this is the sequence of events:


Step 1. Interaction (Client -> API): Your NiceGUI frontend running in the browser says, "Hey FastAPI backend, the user just opened the page. I need the list of leads!"


Step 2. Routed Request (API -> Controller): FastAPI acts like a traffic cop. It receives the request and says, "Ah, they want the CRM data. I'll send this to the specific Python function (Controller) built for fetching CRM leads."


Step 3. Reads/Writes (Controller <--> Database): Your Python function uses your API key to ask Supabase, "Give me all the leads so I can sort them into the 5 columns." Supabase hands the data back to your Python code.


Step 5. UI Update (API -> Client): FastAPI takes that data from Supabase and sends it back to NiceGUI. NiceGUI then draws the cards on your screen.

The "Writing Data" Story (When a lead takes action)


When someone books a call, a slightly different flow happens:


Webhook Trigger (Booking -> API): The booking software sends an automatic HTTP message behind the scenes directly to your FastAPI backend saying, "Hey, [bob@example.com](mailto:bob@example.com) just booked a meeting!"


Step 2. Routed Request (API -> Controller): FastAPI routes this incoming webhook to a specific Python function meant for handling new bookings.


Step 3. Reads/Writes (Controller <--> Database): Your Python function tells Supabase, "Find [bob@example.com](mailto:bob@example.com) and move his status to 'Booked'."


Step 4. Sync (Controller -> HubSpot): Right after saving to Supabase, your Python function tells HubSpot, "Hey, Bob booked a call, update his profile so he stops receiving the automated 'Followup 2' email."