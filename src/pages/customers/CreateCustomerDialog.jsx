import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import {
    Dialog,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';
import FormInput from '../../reusables/form/FormInput';

export default function CreateCustomerDialog({ open, onClose }) {
    const [errors, setErrors] = useState({});

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const message = useAlert();
    const loadingProvider = useLoading();

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', notes: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Customer name is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetForm = () => {
        setFormData({
            name: '', email: '', phone: '', address: '', notes: ''
        });
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose(false);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            loadingProvider.start();

            const customerData = {
                name: formData.name.trim(),
                email: formData.email ? formData.email.trim() : '',
                phone: formData.phone ? formData.phone.trim() : '',
                address: formData.address ? formData.address.trim() : '',
                notes: formData.notes ? formData.notes.trim() : ''
            };

            const customerResponse = await CustomerDAO.createCustomer(customerData);
            if (!customerResponse.success) throw new Error(customerResponse.error || 'Failed to create customer');

            message('Customer created successfully!', 'success');
            onClose(true);
            resetForm();
        } catch (error) {
            console.error(error);
            message(error.message || 'Failed to create customer', 'error');
        } finally {
            loadingProvider.stop();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                style: { borderRadius: isMobile ? '0px' : '12px', overflow: 'hidden' }
            }}
        >
            {/* Header */}
            <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b border-gray-100`}>
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>Create New Customer</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                    <Icon icon="mdi:close" width="24" />
                </button>
            </div>

            {/* Content Body */}
            <div className={`${isMobile ? 'p-4' : 'p-8'} overflow-y-auto`}>
                <div className="space-y-5 animate-fadeIn">
                    <FormInput
                        label="Customer Name"
                        name="name"
                        placeholder="John Doe"
                        icon="lucide:user"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormInput
                            label="Email (Optional)"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            icon="lucide:mail"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                        />
                        <FormInput
                            label="Phone Number"
                            name="phone"
                            placeholder="+62 812 3456 7890"
                            icon="lucide:phone"
                            value={formData.phone}
                            onChange={handleChange}
                            error={errors.phone}
                        />
                    </div>

                    <FormInput
                        label="Address"
                        name="address"
                        placeholder="1234 Main St, Springfield, IL"
                        icon="lucide:map-pin"
                        value={formData.address}
                        onChange={handleChange}
                        error={errors.address}
                    />

                    <FormInput
                        label="Notes"
                        name="notes"
                        placeholder="Add any additional details regarding the customer..."
                        icon="lucide:file-text"
                        multiline
                        value={formData.notes}
                        onChange={handleChange}
                        error={errors.notes}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className={`border-t border-gray-100 ${isMobile ? 'p-4' : 'p-6'} flex justify-end items-center bg-gray-50 gap-3`}>
                <button
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white hover:border-gray-400 transition-colors"
                >
                    Cancel
                </button>

                <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-[#002D5B] text-white text-sm font-medium rounded-md hover:bg-[#001f40] transition-colors shadow-sm flex items-center gap-2"
                >
                    Create Customer
                </button>
            </div>
        </Dialog>
    );
}