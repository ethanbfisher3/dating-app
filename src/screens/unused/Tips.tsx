import React from "react"
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native"
import { openWebsite } from "src/utils/utils"

export default function Tips() {
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        paddingTop: 36,
        backgroundColor: "#fafbfc",
      }}
    >
      <Text
        style={{
          fontWeight: "900",
          fontSize: 36,
          marginVertical: 24,
          color: "#1a1a1a",
        }}
      >
        Finding A Date
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
          Tip 2: Referrals!
        </Text>
        <Text
          style={{
            fontSize: 17,
            lineHeight: 26,
            color: "#555",
            marginBottom: 12,
          }}
        >
          If you're a returned missionary, you probably know what we mean when
          we say work with members. You aren't the only one that has to be
          looking for girls for you. Your roommates, close friends, and family
          can all be looking for girls that you can date.
        </Text>
        <Text
          style={{
            fontSize: 17,
            lineHeight: 26,
            color: "#555",
            marginBottom: 12,
          }}
        >
          Here are some ways to get referrals:
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
            • Classmates: Ask friends in your classes about their dating lives.
            See if they could get you in touch with their friends, roommates,
            coworkers, etc.
          </Text>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 28,
              color: "#555",
              marginLeft: 8,
            }}
          >
            • Roommates: Ask your roommates about their friends. Most likely
            they have some friends who are girls that you could hang out with.
            Maybe you date them, or you begin to ask those girls who you could
            date. Simple!
          </Text>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 28,
              color: "#555",
              marginLeft: 8,
            }}
          >
            • Family: If you have family in the Utah area, you're in luck! Your
            family has their own ward to go to, and many times there are girls
            at college from Utah who go to church back with their families. You
            could try going to church with your family or asking your family if
            there are cute girls in their wards.
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
          Tip 3: Mutual
        </Text>
        <Text
          style={{
            fontSize: 17,
            lineHeight: 26,
            color: "#555",
            marginBottom: 12,
          }}
        >
          There's a reason Mutual is so popular. It works! It's like getting
          media referrals through Facebook on the mission. You're immediately
          put in an environment where there are boys and girls wanting to date.
          You can easily get dates with cuties and find your soulmate after just
          a few minutes making an account and looking around.{" "}
        </Text>
        <View style={styles.rowActions}>
          <View style={{ marginBottom: 12 }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => openWebsite("https://mutual.app/")}
            >
              <Text style={styles.buttonText}>Check out Mutual!</Text>
            </TouchableOpacity>
          </View>
        </View>
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

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1e90ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  rowActions: {
    flexDirection: "row",
    marginTop: 14,
    alignItems: "center",
    gap: 12,
  },
})
