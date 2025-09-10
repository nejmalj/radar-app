import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import radarsData from "../assets/radars.json";
import { MaterialIcons } from '@expo/vector-icons';

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const toRad = (v) => (v * Math.PI) / 180;
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function Index() {
    const [location, setLocation] = useState(null);
    const [region, setRegion] = useState(null);

    const radars = radarsData.map(r => ({
        ...r,
        radius: 500
    }));

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            let pos = await Location.getCurrentPositionAsync({});
            setLocation(pos.coords);
            setRegion({ ...pos.coords, latitudeDelta: 0.1, longitudeDelta: 0.1 });

            Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
                (pos) => {
                    const coords = pos.coords;
                    setLocation(coords);
                    setRegion((r) => ({ ...r, latitude: coords.latitude, longitude: coords.longitude }));

                    radars.forEach((radar) => {
                        const dist = getDistance(coords.latitude, coords.longitude, radar.latitude, radar.longitude);
                        if (dist < radar.radius) {
                            const vmaText = radar.vma ? " - VMA : ${radar.vma} km/h" : "";
                            Alert.alert("Radar détecté", `${radar.type}${vmaText}`);
                        }
                    });
                }
            );
        })();
    }, [radars]);

    if (!region) return null;

    return (
        <View style={styles.container}>
            <MapView style={styles.map} region={region} showsUserLocation>
                {radars.map((r) => (
                    <React.Fragment key={r.id}>
                        <Marker
                            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
                            title={r.vma ? `${r.type} - ${r.vma} km/h` : r.type}
                        >
                            <MaterialIcons name="warning" size={30} color="red" />
                        </Marker>
                            <Circle
                            center={{ latitude: r.latitude, longitude: r.longitude }}
                            radius={r.radius}
                            strokeColor="rgba(255,0,0,0.6)"
                            fillColor="rgba(255,0,0,0.2)"
                        />
                    </React.Fragment>
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
});