import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { supabaseGateway } from '../lib/api';

const TransactionHistoryScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        router.replace('/signin');
        return;
      }

      const response = await supabaseGateway('getTransactionHistory', {
        access_token: accessToken,
        page,
        limit: 10,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setTransactions(response.data.history);
      setTotalPages(response.data.totalPages);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'success':
        return styles.successText;
      case 'failed':
        return styles.failedText;
      default:
        return styles.pendingText;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#4F46E5"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchTransactions()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions found</Text>
        </View>
      ) : (
        <>
          <View style={styles.transactionsContainer}>
            {transactions.map((tx) => (
              <View key={tx.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionType}>
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  </Text>
                  <Text style={styles.transactionAmount}>₦{tx.amount.toFixed(2)}</Text>
                </View>
                <Text style={styles.transactionDetails}>{tx.details}</Text>
                <View style={styles.transactionFooter}>
                  <Text style={styles.transactionDate}>{formatDate(tx.created_at)}</Text>
                  <Text style={[styles.transactionStatus, getStatusColor(tx.status)]}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pagination Controls */}
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === 1 && styles.disabledButton,
              ]}
              onPress={() => fetchTransactions(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>

            <Text style={styles.pageText}>
              Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === totalPages && styles.disabledButton,
              ]}
              onPress={() => fetchTransactions(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  backButton: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
  },
  transactionsContainer: {
    marginBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  transactionDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  successText: {
    color: '#10B981',
  },
  failedText: {
    color: '#EF4444',
  },
  pendingText: {
    color: '#F59E0B',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  paginationButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  paginationButtonText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  pageText: {
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default TransactionHistoryScreen;