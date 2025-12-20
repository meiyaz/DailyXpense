import { View, Text, Pressable, Modal, Alert, Switch, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useExpenses } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { shareAsync } from "expo-sharing";
import { printToFileAsync } from "expo-print";
import { Linking } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface ExportModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function ExportModal({ visible, onClose }: ExportModalProps) {
    const { expenses } = useExpenses();
    const { currency } = useSettings();

    const [exportFilter, setExportFilter] = useState<'all' | 'date' | 'month' | 'year'>('date');
    const [exportFormat, setExportFormat] = useState<'pdf' | 'whatsapp'>('pdf');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const generatePDF = async (filteredExpenses: any[]) => {
        const totalAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0).toFixed(2);

        const html = `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
                        h1 { text-align: center; color: #333; }
                        .summary { margin-bottom: 20px; padding: 10px; background-color: #f3f4f6; border-radius: 8px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                    </style>
                </head>
                <body>
                    <h1>Expense Report</h1>
                    <div class="summary">
                        <p><strong>Date:</strong> ${selectedDate.toLocaleDateString()}</p>
                        <p><strong>Total Expenses:</strong> ${currency} ${totalAmount}</p>
                    </div>
                    <table>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                        ${filteredExpenses.map(item => `
                            <tr>
                                <td>${new Date(item.date).toLocaleDateString()}</td>
                                <td>${item.category}</td>
                                <td>${item.description}</td>
                                <td>${currency} ${item.amount}</td>
                            </tr>
                        `).join('')}
                    </table>
                </body>
            </html>
        `;

        const { uri } = await printToFileAsync({ html });
        return uri;
    };

    const handleExport = async () => {
        try {
            // Filter Data Logic
            let filtered = [...expenses];
            const dateStr = selectedDate.toISOString().split('T')[0];
            const monthStr = selectedDate.getMonth();
            const yearStr = selectedDate.getFullYear();

            if (exportFilter === 'date') {
                filtered = expenses.filter(e => e.date.startsWith(dateStr));
            } else if (exportFilter === 'month') {
                filtered = expenses.filter(e => {
                    const d = new Date(e.date);
                    return d.getMonth() === monthStr && d.getFullYear() === yearStr;
                });
            } else if (exportFilter === 'year') {
                filtered = expenses.filter(e => new Date(e.date).getFullYear() === yearStr);
            }

            if (filtered.length === 0) {
                Alert.alert("No Data", "There are no expenses to export for the selected period.");
                return;
            }

            if (exportFormat === 'whatsapp') {
                const total = filtered.reduce((sum, e) => sum + e.amount, 0).toFixed(2);
                let message = `*Expense Report*\nDate: ${selectedDate.toLocaleDateString()}\nTotal: ${currency} ${total}\n\n*Details:*\n`;
                filtered.forEach(e => {
                    message += `- ${e.category}: ${currency}${e.amount} (${e.description})\n`;
                });

                const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                } else {
                    Alert.alert("WhatsApp Not Installed", "Please install WhatsApp to use this feature.");
                }
            } else if (exportFormat === 'pdf') {
                const uri = await generatePDF(filtered);
                await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }

            onClose();
        } catch (error) {
            Alert.alert("Export Error", "Failed to export data.");
            console.error(error);
        }
    };

    const onDateChange = (event: any, selected?: Date) => {
        setShowDatePicker(false);
        if (selected) setSelectedDate(selected);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
                <Pressable className="bg-white dark:bg-gray-900 rounded-t-3xl p-5 pb-10" onPress={(e) => e.stopPropagation()}>
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-800 dark:text-white">Export Data</Text>
                        <Pressable onPress={onClose} className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <Ionicons name="close" size={20} color="#6b7280" />
                        </Pressable>
                    </View>

                    <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Filter By</Text>
                    <View className="flex-row gap-2 mb-6">
                        {(['date', 'month', 'year', 'all'] as const).map((type) => (
                            <Pressable
                                key={type}
                                onPress={() => setExportFilter(type)}
                                className={`px-4 py-2 rounded-lg border ${exportFilter === type ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                            >
                                <Text className={`font-bold capitalize ${exportFilter === type ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>{type}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Format</Text>
                    <View className="flex-row gap-2 mb-6">
                        {[
                            { id: 'pdf', label: 'PDF', icon: 'document' },
                            { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' }
                        ].map((fmt) => (
                            <Pressable
                                key={fmt.id}
                                onPress={() => setExportFormat(fmt.id as any)}
                                className={`flex-1 flex-row items-center justify-center px-2 py-3 rounded-lg border ${exportFormat === fmt.id ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                            >
                                <Ionicons name={fmt.icon as any} size={16} color={exportFormat === fmt.id ? 'white' : '#4b5563'} style={{ marginRight: 6 }} />
                                <Text className={`font-bold text-xs ${exportFormat === fmt.id ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>{fmt.label}</Text>
                            </Pressable>
                        ))}
                    </View>

                    {exportFilter !== 'all' && (
                        <View className="mb-6">
                            <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Select {exportFilter}</Text>
                            <Pressable
                                onPress={() => setShowDatePicker(true)}
                                className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex-row justify-between items-center"
                            >
                                <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                    {exportFilter === 'date' && selectedDate.toLocaleDateString()}
                                    {exportFilter === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    {exportFilter === 'year' && selectedDate.getFullYear().toString()}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                            </Pressable>
                        </View>
                    )}

                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}

                    <Pressable
                        onPress={handleExport}
                        className="bg-blue-600 p-4 rounded-xl items-center"
                    >
                        <Text className="text-white font-bold text-lg">
                            {exportFormat === 'whatsapp' ? 'Share on WhatsApp' : `Export to ${exportFormat.toUpperCase()}`}
                        </Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
