import React from 'react';
import { User, Music, PlayCircle, Heart, Users, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UserProfile = ({ user }) => {
  const isArtist = user?.isArtist;

  const ArtistProfile = () => (
    <div className="container mt-8 mx-auto px-4">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <img src="/api/placeholder/150/150" alt="Artist" className="rounded-full mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">{user?.username}</h2>
                <p className="text-gray-400 mb-4">Artist</p>
                <div className="flex justify-center gap-4 text-gray-400">
                  <div className="text-center">
                    <div className="font-bold">{user?.followers?.length || 0}</div>
                    <div className="text-sm">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{user?.songs?.length || 0}</div>
                    <div className="text-sm">Songs</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-3/4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Upload New Song
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition">
                  <Plus className="inline-block w-5 h-5 mr-2" />
                  Upload Track
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Your Tracks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((track) => (
                    <div key={track} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                      <img src="/api/placeholder/48/48" alt="Track" className="rounded" />
                      <div className="flex-1">
                        <h4 className="font-medium">Track Name {track}</h4>
                        <p className="text-sm text-gray-400">Album • Genre</p>
                      </div>
                      <div className="text-gray-400">3:45</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  const RegularUserProfile = () => (
    <div className="container mt-8 mx-auto px-4">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <img src="/api/placeholder/150/150" alt="User" className="rounded-full mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">{user?.username}</h2>
                <p className="text-gray-400 mb-4">Music Enthusiast</p>
                <div className="flex justify-center gap-4 text-gray-400">
                  <div className="text-center">
                    <div className="font-bold">{user?.playlists?.length || 0}</div>
                    <div className="text-sm">Playlists</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{user?.following?.length || 0}</div>
                    <div className="text-sm">Following</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-3/4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Your Playlists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((playlist) => (
                    <div key={playlist} className="bg-gray-800 rounded-lg p-4">
                      <img src="/api/placeholder/200/200" alt="Playlist" className="w-full rounded-lg mb-3" />
                      <h4 className="font-medium">Playlist {playlist}</h4>
                      <p className="text-sm text-gray-400">15 songs</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Liked Songs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((song) => (
                    <div key={song} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                      <img src="/api/placeholder/48/48" alt="Song" className="rounded" />
                      <div className="flex-1">
                        <h4 className="font-medium">Liked Song {song}</h4>
                        <p className="text-sm text-gray-400">Artist • Album</p>
                      </div>
                      <div className="text-gray-400">3:45</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  return isArtist ? <ArtistProfile /> : <RegularUserProfile />;
};

export default UserProfile;
