import { useEffect, useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";

export default function Index() {
    const [location, setLocation] = useState(null);
    const [region, setRegion] = useState(null);

    const radar = {
        latitude: 45.1796760559082,
        longitude: 5.717731952667236,
        radius: 200,
    };

    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const toRad = (value) => (value * Math.PI) / 180;

        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δφ = toRad(lat2 - lat1);
        const Δλ = toRad(lon2 - lon1);

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.log("Permission refusée pour la localisation");
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation.coords);
            setRegion({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });

            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 2000,
                    distanceInterval: 5,
                },
                (pos) => {
                    setLocation(pos.coords);
                    setRegion((prev) => ({
                        ...prev,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    }));

                    const distance = getDistance(
                        pos.coords.latitude,
                        pos.coords.longitude,
                        radar.latitude,
                        radar.longitude
                    );

                    if (distance < radar.radius) {
                        Alert.alert("Attention", "Vous entrez dans une zone radar !");
                    }
                }
            );
        })();
    }, [radar.latitude, radar.longitude, radar.radius]);

    return (
        <View style={styles.container}>
            {region && (
                <MapView style={styles.map} region={region} showsUserLocation={true}>
                    <Marker
                        coordinate={{ latitude: radar.latitude, longitude: radar.longitude }}
                        title="Radar fixe"
                        pinColor="red"
                    />

                    <Circle
                        center={{ latitude: radar.latitude, longitude: radar.longitude }}
                        radius={radar.radius}
                        strokeColor="rgba(255,0,0,0.6)"
                        fillColor="rgba(255,0,0,0.2)"
                    />
                </MapView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: "100%",
        height: "100%",
    },
});
