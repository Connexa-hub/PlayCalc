import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const NEWS_API_KEY = "pub_de1c59c342574862a457fb9e0ca62653".trim();

export default function NewsFeed({ currency }: any) {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const getNews = async () => {
      const storageKey = `news_${currency}`;
      const cachedNews = await AsyncStorage.getItem(storageKey);
      if (cachedNews && mounted) setNews(JSON.parse(cachedNews));
      setLoading(true);
      const net = await NetInfo.fetch();
      if (!net.isConnected && cachedNews) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&q=${currency}+finance&language=en&category=business`
        );
        const data = await response.json();
        if (data.results && mounted) {
          setNews(data.results);
          await AsyncStorage.setItem(storageKey, JSON.stringify(data.results));
        }
      } catch (e) {
        // Use cached news if available
      } finally {
        if (mounted) setLoading(false);
      }
    };
    getNews();
    return () => { mounted = false; };
  }, [currency]);

  if (loading) return <Text style={styles.loading}>Loading news...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Latest {currency} News</Text>
      <ScrollView style={styles.newsList} nestedScrollEnabled={true}>
        {news.length === 0 ? (
          <Text style={{ color: '#888', margin: 10 }}>No news found.</Text>
        ) : (
          news.map((item: any) => (
            <TouchableOpacity key={item.link} style={styles.newsCard} onPress={() => Linking.openURL(item.link)}>
              {item.image_url && <Image source={{ uri: item.image_url }} style={styles.newsImage} />}
              <View style={styles.newsText}>
                <Text style={styles.newsTitle}>{item.title}</Text>
                {item.description && <Text style={styles.newsDesc}>{item.description}</Text>}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#00e676' },
  newsList: { maxHeight: 200 },
  newsCard: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6, backgroundColor: '#1e1e1e', padding: 10, borderRadius: 8 },
  newsImage: { width: 80, height: 60, borderRadius: 4, marginRight: 10 },
  newsText: { flex: 1 },
  newsTitle: { color: '#fffacd', fontWeight: 'bold' },
  newsDesc: { color: '#aaa', fontSize: 12, marginTop: 4 },
  loading: { color: '#00e676', margin: 12 },
});
