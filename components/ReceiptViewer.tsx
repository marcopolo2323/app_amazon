import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { captureRef } from 'react-native-view-shot';

interface ReceiptItem {
  label: string;
  value: string;
  highlight?: boolean;
}

interface ReceiptViewerProps {
  visible: boolean;
  type: 'transaction' | 'payment';
  receiptNumber: string;
  date: string;
  items: ReceiptItem[];
  total: number;
  notes?: string;
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export default function ReceiptViewer({
  visible,
  type,
  receiptNumber,
  date,
  items,
  total,
  notes,
  onClose,
  onDownload,
  onShare,
}: ReceiptViewerProps) {
  const receiptRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const getTitle = () => {
    return type === 'transaction' ? 'Comprobante de Transacción' : 'Recibo de Pago';
  };

  const generateHTML = () => {
    const itemsHTML = items.map(item => `
      <tr>
        <td style="padding: 12px 0; color: ${item.highlight ? '#111827' : '#6B7280'}; font-weight: ${item.highlight ? '600' : 'normal'};">
          ${item.label}
        </td>
        <td style="padding: 12px 0; text-align: right; color: ${item.highlight ? '#2563EB' : '#111827'}; font-weight: ${item.highlight ? 'bold' : '500'};">
          ${item.value}
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px 20px;
              background: white;
            }
            .container { max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; }
            .company-name { font-size: 28px; font-weight: bold; color: #111827; margin-bottom: 8px; }
            .company-info { font-size: 14px; color: #6B7280; margin-bottom: 4px; }
            .receipt-info { text-align: center; margin-bottom: 30px; }
            .receipt-badge { 
              display: inline-block;
              background: #EFF6FF;
              padding: 8px 16px;
              border-radius: 20px;
              margin-bottom: 12px;
            }
            .receipt-type { 
              font-size: 12px;
              font-weight: bold;
              color: #2563EB;
              letter-spacing: 1px;
            }
            .receipt-number { font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 4px; }
            .receipt-date { font-size: 14px; color: #6B7280; }
            .divider { height: 1px; background: #E5E7EB; margin: 20px 0; }
            .items-table { width: 100%; border-collapse: collapse; }
            .total-section {
              background: #F9FAFB;
              padding: 16px;
              border-radius: 12px;
              margin: 20px 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label { font-size: 18px; font-weight: bold; color: #111827; }
            .total-value { font-size: 24px; font-weight: bold; color: #10B981; }
            .notes-section {
              background: #FEF3C7;
              padding: 16px;
              border-radius: 12px;
              margin: 20px 0;
            }
            .notes-label { font-size: 14px; font-weight: 600; color: #92400E; margin-bottom: 8px; }
            .notes-text { font-size: 14px; color: #78350F; line-height: 1.5; }
            .footer { text-align: center; margin-top: 40px; }
            .footer-icon { font-size: 48px; color: #10B981; margin-bottom: 12px; }
            .footer-text { font-size: 16px; font-weight: 600; color: #10B981; margin-bottom: 4px; }
            .footer-subtext { font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-name">Amazon Group</div>
              <div class="company-info">Plataforma de Servicios</div>
              <div class="company-info">RUC: 20XXXXXXXXX</div>
            </div>

            <div class="receipt-info">
              <div class="receipt-badge">
                <span class="receipt-type">${type === 'transaction' ? 'TRANSACCIÓN' : 'PAGO'}</span>
              </div>
              <div class="receipt-number">N° ${receiptNumber}</div>
              <div class="receipt-date">${date}</div>
            </div>

            <div class="divider"></div>

            <table class="items-table">
              ${itemsHTML}
            </table>

            <div class="divider"></div>

            <div class="total-section">
              <span class="total-label">TOTAL</span>
              <span class="total-value">S/ ${total.toFixed(2)}</span>
            </div>

            ${notes ? `
              <div class="notes-section">
                <div class="notes-label">Notas:</div>
                <div class="notes-text">${notes}</div>
              </div>
            ` : ''}

            <div class="footer">
              <div class="footer-icon">✓</div>
              <div class="footer-text">
                ${type === 'transaction' ? 'Transacción Completada' : 'Pago Registrado'}
              </div>
              <div class="footer-subtext">Este documento es un comprobante válido</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    try {
      setGenerating(true);
      
      // Generar PDF desde HTML
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      // Compartir el PDF (permite guardar)
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Guardar o compartir comprobante',
          UTI: 'com.adobe.pdf',
        });
        Alert.alert('Éxito', 'PDF generado correctamente');
      } else {
        Alert.alert('PDF Generado', `Archivo guardado en: ${uri}`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    try {
      setGenerating(true);
      
      // Generar PDF
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      // Compartir
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir comprobante',
        });
      } else {
        Alert.alert('No disponible', 'La función de compartir no está disponible');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'No se pudo compartir el PDF. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getTitle()}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Receipt Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Company Info */}
            <View style={styles.companySection}>
              <Text style={styles.companyName}>Amazon Group</Text>
              <Text style={styles.companyInfo}>Plataforma de Servicios</Text>
              <Text style={styles.companyInfo}>RUC: 20XXXXXXXXX</Text>
            </View>

            {/* Receipt Info */}
            <View style={styles.receiptInfo}>
              <View style={styles.receiptBadge}>
                <Text style={styles.receiptType}>
                  {type === 'transaction' ? 'TRANSACCIÓN' : 'PAGO'}
                </Text>
              </View>
              <Text style={styles.receiptNumber}>N° {receiptNumber}</Text>
              <Text style={styles.receiptDate}>{date}</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Items */}
            <View style={styles.itemsSection}>
              {items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={[
                    styles.itemLabel,
                    item.highlight && styles.itemLabelHighlight
                  ]}>
                    {item.label}
                  </Text>
                  <Text style={[
                    styles.itemValue,
                    item.highlight && styles.itemValueHighlight
                  ]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Total */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>S/ {total.toFixed(2)}</Text>
            </View>

            {/* Notes */}
            {notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notas:</Text>
                <Text style={styles.notesText}>{notes}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <Text style={styles.footerText}>
                {type === 'transaction' 
                  ? 'Transacción Completada' 
                  : 'Pago Registrado'}
              </Text>
              <Text style={styles.footerSubtext}>
                Este documento es un comprobante válido
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, generating && styles.actionButtonDisabled]} 
              onPress={handleDownload}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#2563EB" />
                  <Text style={styles.actionButtonText}>Descargar PDF</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, generating && styles.actionButtonDisabled]} 
              onPress={handleShare}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={20} color="#2563EB" />
                  <Text style={styles.actionButtonText}>Compartir</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  companySection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  companyInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  receiptInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  receiptBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  receiptType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
    letterSpacing: 1,
  },
  receiptNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  itemsSection: {
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  itemLabelHighlight: {
    fontWeight: '600',
    color: '#111827',
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  itemValueHighlight: {
    fontWeight: 'bold',
    color: '#2563EB',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  notesSection: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 12,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
});
