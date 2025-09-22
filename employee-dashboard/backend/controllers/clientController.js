const Client = require('../../models/Client');

// In-memory store for demo mode
let demoClients = [
    {
        _id: 'demo_client_1',
        name: 'Dental Care Inc.',
        contactPerson: 'Dr. Emily Carter',
        email: 'emily.c@dentalcare.com',
        phone: '(555) 123-4567',
        address: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001' },
        practiceType: 'General Dentistry',
        status: 'Active',
        clientNumber: 'GDB-C001',
        billing: { totalBilled: 45200, totalPaid: 40100, outstandingBalance: 5100 },
        contractStartDate: '2024-01-15',
        logoUrl: 'https://guardiandentalbilling.com/wp-content/uploads/2025/02/Logo-250-x-150-px-1.png',
        createdAt: new Date().toISOString()
    },
    {
        _id: 'demo_client_2',
        name: 'Bright Smiles LLC',
        contactPerson: 'Michael Thompson',
        email: 'm.thompson@brightsmiles.com',
        phone: '(555) 987-6543',
        address: { street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zipCode: '90210' },
        practiceType: 'Pediatric Dentistry',
        status: 'Active',
        clientNumber: 'GDB-C002',
        billing: { totalBilled: 32000, totalPaid: 32000, outstandingBalance: 0 },
        contractStartDate: '2023-06-10',
        logoUrl: 'https://guardiandentalbilling.com/wp-content/uploads/2025/02/Logo-250-x-150-px-1.png',
        createdAt: new Date().toISOString()
    },
    {
        _id: 'demo_client_3',
        name: 'Ortho Solutions',
        contactPerson: 'Jessica Chen',
        email: 'j.chen@orthosolutions.net',
        phone: '(555) 222-3333',
        address: { street: '789 Pine St', city: 'Chicago', state: 'IL', zipCode: '60601' },
        practiceType: 'Orthodontics',
        status: 'Inactive',
        clientNumber: 'GDB-C003',
        billing: { totalBilled: 68500, totalPaid: 50000, outstandingBalance: 18500 },
        contractStartDate: '2023-03-20',
        logoUrl: 'https://guardiandentalbilling.com/wp-content/uploads/2025/02/Logo-250-x-150-px-1.png',
        createdAt: new Date().toISOString()
    },
    {
        _id: 'demo_client_4',
        name: 'Healthy Smiles',
        contactPerson: 'Priya Patel',
        email: 'priya@healthysmiles.com',
        phone: '(555) 555-1234',
        address: { street: '321 Elm Dr', city: 'Miami', state: 'FL', zipCode: '33101' },
        practiceType: 'Cosmetic Dentistry',
        status: 'Active',
        clientNumber: 'GDB-C004',
        billing: { totalBilled: 21000, totalPaid: 18500, outstandingBalance: 2500 },
        contractStartDate: '2024-02-01',
        logoUrl: 'https://guardiandentalbilling.com/wp-content/uploads/2025/02/Logo-250-x-150-px-1.png',
        createdAt: new Date().toISOString()
    }
];

// @desc    Get all clients
// @route   GET /api/clients
// @access  Public (should be protected in production)
const getAllClients = async (req, res) => {
    try {
        // Demo mode when MongoDB is not connected
        if (!global.mongoConnected) {
            console.log('Demo mode - returning stored clients, count:', demoClients.length);
            
            const { status, practiceType } = req.query;
            let filteredClients = [...demoClients];
            
            if (status) {
                filteredClients = filteredClients.filter(client => client.status === status);
            }
            if (practiceType) {
                filteredClients = filteredClients.filter(client => client.practiceType === practiceType);
            }
            
            return res.json(filteredClients);
        }

        const { status, practiceType, page = 1, limit = 50 } = req.query;
        
        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (practiceType) filter.practiceType = practiceType;

        const clients = await Client.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Client.countDocuments(filter);

        res.json({
            clients,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error getting clients:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get single client by ID
// @route   GET /api/clients/:id
// @access  Public (should be protected in production)
const getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }
        
        res.json(client);
    } catch (error) {
        console.error('Error getting client:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Public (should be protected in production)
const createClient = async (req, res) => {
    try {
        const {
            name,
            contactPerson,
            email,
            phone,
            address,
            practiceType,
            services,
            website,
            taxId,
            businessLicense,
            logoUrl
        } = req.body;

        // Demo mode fallback
        if (!global.mongoConnected) {
            console.log('Creating client in demo mode');
            
            // Check if email already exists in demo data
            const existingClient = demoClients.find(client => client.email === email);
            if (existingClient) {
                return res.status(400).json({ msg: 'Client with this email already exists' });
            }
            
            // Generate a unique ID for demo mode
            const newClient = {
                _id: 'demo_client_' + Date.now(),
                name,
                contactPerson,
                email,
                phone: phone || '',
                address: address || {},
                practiceType: practiceType || 'General Dentistry',
                status: 'Active',
                clientNumber: 'GDB-C' + String(demoClients.length + 1).padStart(3, '0'),
                billing: {
                    totalBilled: 0,
                    totalPaid: 0,
                    outstandingBalance: 0,
                    paymentTerms: 'Net 30'
                },
                contractStartDate: new Date().toISOString().split('T')[0],
                services: services || [],
                website: website || '',
                taxId: taxId || '',
                businessLicense: businessLicense || '',
                logoUrl: logoUrl || 'https://guardiandentalbilling.com/wp-content/uploads/2025/02/Logo-250-x-150-px-1.png',
                notes: [],
                documents: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Add to demo clients array
            demoClients.push(newClient);
            
            return res.status(201).json({ 
                msg: 'Client created successfully (Demo Mode)', 
                client: newClient 
            });
        }

        // Check if client with email already exists
        let existingClient = await Client.findOne({ email });
        if (existingClient) {
            return res.status(400).json({ msg: 'Client with this email already exists' });
        }

        // Create new client
        const client = new Client({
            name,
            contactPerson,
            email,
            phone,
            address,
            practiceType: practiceType || 'General Dentistry',
            services: services || [],
            website,
            taxId,
            businessLicense,
            logoUrl
        });

        const savedClient = await client.save();
        
        res.status(201).json({ 
            msg: 'Client created successfully', 
            client: savedClient 
        });

    } catch (error) {
        console.error('Error creating client:', error.message);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ msg: 'Validation Error', errors });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Public (should be protected in production)
const updateClient = async (req, res) => {
    try {
        // Demo mode fallback
        if (!global.mongoConnected) {
            console.log('Updating client in demo mode');
            
            const clientIndex = demoClients.findIndex(client => client._id === req.params.id);
            if (clientIndex === -1) {
                return res.status(404).json({ msg: 'Client not found' });
            }
            
            const {
                name,
                contactPerson,
                email,
                phone,
                address,
                practiceType,
                status,
                services,
                website,
                taxId,
                businessLicense,
                logoUrl,
                billing,
                notes
            } = req.body;
            
            // Update the client in demo array
            const updatedClient = {
                ...demoClients[clientIndex],
                name: name || demoClients[clientIndex].name,
                contactPerson: contactPerson || demoClients[clientIndex].contactPerson,
                email: email || demoClients[clientIndex].email,
                phone: phone !== undefined ? phone : demoClients[clientIndex].phone,
                address: address || demoClients[clientIndex].address,
                practiceType: practiceType || demoClients[clientIndex].practiceType,
                status: status || demoClients[clientIndex].status,
                services: services || demoClients[clientIndex].services,
                website: website !== undefined ? website : demoClients[clientIndex].website,
                taxId: taxId !== undefined ? taxId : demoClients[clientIndex].taxId,
                businessLicense: businessLicense !== undefined ? businessLicense : demoClients[clientIndex].businessLicense,
                logoUrl: logoUrl || demoClients[clientIndex].logoUrl,
                billing: billing ? { ...demoClients[clientIndex].billing, ...billing } : demoClients[clientIndex].billing,
                updatedAt: new Date().toISOString()
            };
            
            demoClients[clientIndex] = updatedClient;
            
            return res.json({ 
                msg: 'Client updated successfully (Demo Mode)', 
                client: updatedClient 
            });
        }

        let client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        const {
            name,
            contactPerson,
            email,
            phone,
            address,
            practiceType,
            status,
            services,
            website,
            taxId,
            businessLicense,
            logoUrl,
            billing,
            notes
        } = req.body;

        // Check if email is being changed and if new email already exists
        if (email && email !== client.email) {
            const existingClient = await Client.findOne({ email });
            if (existingClient) {
                return res.status(400).json({ msg: 'Client with this email already exists' });
            }
        }

        // Update fields
        const updateFields = {};
        if (name) updateFields.name = name;
        if (contactPerson) updateFields.contactPerson = contactPerson;
        if (email) updateFields.email = email;
        if (phone) updateFields.phone = phone;
        if (address) updateFields.address = address;
        if (practiceType) updateFields.practiceType = practiceType;
        if (status) updateFields.status = status;
        if (services) updateFields.services = services;
        if (website !== undefined) updateFields.website = website;
        if (taxId !== undefined) updateFields.taxId = taxId;
        if (businessLicense !== undefined) updateFields.businessLicense = businessLicense;
        if (logoUrl !== undefined) updateFields.logoUrl = logoUrl;
        if (billing) updateFields.billing = { ...client.billing, ...billing };

        // Add notes if provided
        if (notes) {
            const newNote = {
                note: notes,
                addedBy: 'System', // In production, this would be the logged-in user
                addedAt: new Date()
            };
            updateFields.$push = { notes: newNote };
        }

        client = await Client.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );

        res.json({ 
            msg: 'Client updated successfully', 
            client 
        });

    } catch (error) {
        console.error('Error updating client:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Client not found' });
        }
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ msg: 'Validation Error', errors });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Public (should be protected in production)
const deleteClient = async (req, res) => {
    try {
        // Demo mode fallback
        if (!global.mongoConnected) {
            console.log('Deleting client in demo mode');
            const clientIndex = demoClients.findIndex(client => client._id === req.params.id);
            if (clientIndex === -1) {
                return res.status(404).json({ msg: 'Client not found' });
            }
            
            demoClients.splice(clientIndex, 1);
            return res.json({ msg: 'Client removed successfully (Demo Mode)' });
        }

        const client = await Client.findById(req.params.id);
        
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        await Client.findByIdAndDelete(req.params.id);
        
        res.json({ msg: 'Client removed successfully' });

    } catch (error) {
        console.error('Error deleting client:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get clients by status
// @route   GET /api/clients/status/:status
// @access  Public (should be protected in production)
const getClientsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const validStatuses = ['Active', 'Inactive', 'Pending', 'Suspended'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Invalid status. Must be Active, Inactive, Pending, or Suspended' });
        }

        const clients = await Client.find({ status }).sort({ name: 1 });
        res.json(clients);

    } catch (error) {
        console.error('Error getting clients by status:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Search clients
// @route   GET /api/clients/search?q=searchterm
// @access  Public (should be protected in production)
const searchClients = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ msg: 'Search query is required' });
        }

        const clients = await Client.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { contactPerson: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { practiceType: { $regex: q, $options: 'i' } },
                { clientNumber: { $regex: q, $options: 'i' } }
            ]
        }).sort({ name: 1 });

        res.json(clients);

    } catch (error) {
        console.error('Error searching clients:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get client statistics
// @route   GET /api/clients/stats
// @access  Public (should be protected in production)
const getClientStats = async (req, res) => {
    try {
        const stats = await Client.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalBilled: { $sum: '$billing.totalBilled' },
                    totalPaid: { $sum: '$billing.totalPaid' },
                    outstandingBalance: { $sum: '$billing.outstandingBalance' }
                }
            }
        ]);

        const practiceTypeStats = await Client.aggregate([
            {
                $group: {
                    _id: '$practiceType',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalClients = await Client.countDocuments();
        const activeClients = await Client.countDocuments({ status: 'Active' });
        
        const billingStats = await Client.aggregate([
            {
                $group: {
                    _id: null,
                    totalBilled: { $sum: '$billing.totalBilled' },
                    totalPaid: { $sum: '$billing.totalPaid' },
                    totalOutstanding: { $sum: '$billing.outstandingBalance' }
                }
            }
        ]);

        res.json({
            statusStats: stats,
            practiceTypeStats,
            totalClients,
            activeClients,
            billingStats: billingStats[0] || { totalBilled: 0, totalPaid: 0, totalOutstanding: 0 }
        });

    } catch (error) {
        console.error('Error getting client stats:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Update client billing
// @route   PUT /api/clients/:id/billing
// @access  Public (should be protected in production)
const updateClientBilling = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        const { totalBilled, totalPaid, lastPaymentDate, paymentTerms } = req.body;

        const billingUpdate = {};
        if (totalBilled !== undefined) billingUpdate['billing.totalBilled'] = totalBilled;
        if (totalPaid !== undefined) billingUpdate['billing.totalPaid'] = totalPaid;
        if (lastPaymentDate) billingUpdate['billing.lastPaymentDate'] = new Date(lastPaymentDate);
        if (paymentTerms) billingUpdate['billing.paymentTerms'] = paymentTerms;

        const updatedClient = await Client.findByIdAndUpdate(
            req.params.id,
            billingUpdate,
            { new: true, runValidators: true }
        );

        res.json({ 
            msg: 'Client billing updated successfully', 
            client: updatedClient 
        });

    } catch (error) {
        console.error('Error updating client billing:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

module.exports = {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    getClientsByStatus,
    searchClients,
    getClientStats,
    updateClientBilling
};