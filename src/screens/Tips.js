import React from "react"
import { ScrollView, Text, View } from "react-native"

export default function Tips() {
  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, backgroundColor: "#fafbfc" }}
    >
      <Text
        style={{
          fontWeight: "900",
          fontSize: 36,
          marginVertical: 24,
          color: "#1a1a1a",
        }}
      >
        Tips for Finding Girls
      </Text>

      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontStyle: "italic",
            color: "#555",
            lineHeight: 26,
          }}
        >
          "And their young men and their daughters became exceedingly fair." (3
          Nephi 2:16)
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 12,
            color: "#1e90ff",
          }}
        >
          Welcome!
        </Text>
        <Text
          style={{
            marginBottom: 0,
            fontSize: 17,
            lineHeight: 26,
            color: "#555",
          }}
        >
          Welcome to your ultimate guide for navigating the Provo dating scene!
          Whether you're a fresh RM looking to find your eternal companion or a
          seasoned student ready to take your dating game to the next level,
          we've got you covered. Our carefully curated tips and strategies are
          designed to help you build meaningful connections, boost your
          confidence, and increase your chances of finding that special someone.
          From understanding the unique dynamics of Provo's dating culture to
          mastering the art of conversation and making lasting impressions,
          these proven techniques will give you the edge you need in the
          competitive world of college dating. Remember, finding love isn't just
          about luck—it's about being prepared, staying true to yourself, and
          putting in the effort to create genuine connections. Let's help you
          find your happily ever after!
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 12,
            color: "#1e90ff",
          }}
        >
          Tip 1: Go to Events
        </Text>
        <Text
          style={{
            fontSize: 17,
            lineHeight: 26,
            color: "#555",
            marginBottom: 12,
          }}
        >
          Provo, Utah is full of events for boys and girls to get out of the
          apartment and get to know each other! For example:
        </Text>
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 28,
              color: "#555",
              marginLeft: 8,
            }}
          >
            • Ward Activities (Family Home Evening, Ward Prayer)
          </Text>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 28,
              color: "#555",
              marginLeft: 8,
            }}
          >
            • College Events (Engineering Activities, Foreign Language Events,
            etc.)
          </Text>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 28,
              color: "#555",
              marginLeft: 8,
            }}
          >
            • YServe Events
          </Text>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 28,
              color: "#555",
              marginLeft: 8,
            }}
          >
            • Clubs
          </Text>
        </View>
        <Text
          style={{
            fontSize: 17,
            lineHeight: 26,
            color: "#555",
          }}
        >
          For the full list of local clubs and events, check out the Clubs and
          On-Campus Events pages!
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#f8f9fa",
          padding: 20,
          borderRadius: 12,
          marginBottom: 32,
        }}
      >
        <Text
          style={{
            fontSize: 17,
            lineHeight: 26,
            color: "#555",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          Good luck in your dating journey! 🎯
        </Text>
      </View>
    </ScrollView>
  )
}
